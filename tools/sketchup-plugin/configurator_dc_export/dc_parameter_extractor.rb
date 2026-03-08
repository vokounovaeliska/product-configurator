# frozen_string_literal: true

require "json"
require "fileutils"

# Extracts Dynamic Component parameters from a SketchUp model and exports
# them to parameters.json with effects supporting one-to-many mapping
# (e.g. width affects Top, Bottom, and Legs2 position).
# Supports Groups, Components, and formulas like Parent!param or ComponentName!param.

module ConfiguratorDcExport
  SCALE_PARAMS = %w[LenX LenY LenZ lenx leny lenz prumer průměr].freeze
  MATERIAL_PARAMS = %w[color barva material].freeze

  # Formulas often use sycek!leny, sycek!lenz (parent refs). Map to Group params.
  PARAM_ALIASES = {
    "leny" => %w[height vyska LenY],
    "lenx" => %w[width sirka LenX],
    "lenz" => %w[depth hloubka LenZ],
    "avar" => %w[avariant variant typ],
  }.freeze

  class << self
    def export_parameters
      model = Sketchup.active_model
      return UI.messagebox("No active model.", MB_OK) unless model

      result = collect_parameters(model)
      params = result["parameters"] || []
      return UI.messagebox("No Dynamic Component parameters found.\n\nTip: Select the root group/component with your parameters, then try again.", MB_OK) if params.empty?

      default_zip = default_configurator_export_path(model)
      zip_path = UI.savepanel("Export for Configurator (zip + GLB)", File.dirname(default_zip), File.basename(default_zip))
      return if zip_path.nil? || zip_path.empty?

      zip_path = zip_path + ".zip" unless zip_path.downcase.end_with?(".zip")
      export_dir = File.dirname(zip_path)
      base_name = File.basename(zip_path, ".zip")

      temp_dir = Dir.mktmpdir("configurator_export_")
      begin
        materials_data = export_materials_from_model(model, result["materialNames"] || [], temp_dir)
        result["materials"] = materials_data
        result.delete("materialNames")

        json_path = File.join(temp_dir, "parameters.json")
        File.open(json_path, "w:UTF-8") { |f| f.write(JSON.pretty_generate(result)) }

        create_zip_archive(temp_dir, zip_path)
      ensure
        FileUtils.rm_rf(temp_dir)
      end

      glb_path = File.join(export_dir, "#{base_name}.glb")
      glb_ok = model.export(glb_path)

      mat_count = materials_data.size
      lines = ["Exported #{params.length} parameters and #{mat_count} material(s) to zip:", zip_path]
      lines << "Exported GLB:" << glb_path if glb_ok
      lines << "(GLB export failed – export manually: File → Export → 3D Model → glTF)" unless glb_ok
      UI.messagebox(lines.join("\n"), MB_OK)
    end

    def debug_run
      model = Sketchup.active_model
      unless model
        UI.messagebox("No active model.", MB_OK)
        return
      end

      lines = []
      log = ->(msg) { lines << msg; puts "[Configurator] #{msg}" }

      log.call("=== Configurator DC Export Debug ===")
      log.call("Model: #{model.path.empty? ? '(unsaved)' : model.path}")

      sel = model.selection
      log.call("Selection: #{sel.count} item(s)")
      sel.each_with_index { |e, i| log.call("  [#{i}] #{e.class} #{e.respond_to?(:definition) ? "def=#{e.definition&.name}" : ""}") }

      log.call("Top-level entities: #{model.entities.count}")
      model.entities.each_with_index do |e, i|
        defn = e.respond_to?(:definition) ? e.definition : nil
        dict = defn ? (e.attribute_dictionaries&.[]("dynamic_attributes") || defn.attribute_dictionaries&.[]("dynamic_attributes")) : nil
        log.call("  [#{i}] #{e.class} name=#{defn&.name} has_dc=#{!dict.nil?} keys=#{dict&.keys&.count || 0}")
      end

      log.call("Definitions with dynamic_attributes:")
      model.definitions.each do |defn|
        next if defn.image?
        dict = defn.attribute_dictionaries&.[]("dynamic_attributes")
        next unless dict
        log.call("  #{defn.name} (#{defn.guid[0..7]}): #{dict.keys.reject { |k| k.to_s.start_with?("_") }.join(', ')}")
      end

      result = collect_parameters(model)
      params = result["parameters"] || []
      log.call("Parameters found: #{params.length}")
      params.each { |p| log.call("  - #{p['name']}") }

      mat_names = result["materialNames"] || []
      log.call("Materials to export: #{mat_names.length}")
      mat_names.each { |n| log.call("  - #{n}") }
      log.call("Model materials total: #{model.materials.size}")

      UI.messagebox(
        "Debug output written to Ruby Console.\n\n" \
        "Open: Window → Ruby Console\n\n" \
        "Summary:\n" \
        "- Selection: #{sel.count} item(s)\n" \
        "- Top entities: #{model.entities.count}\n" \
        "- Parameters found: #{params.length}\n" \
        "- Materials to export: #{mat_names.length}",
        MB_OK
      )
    end

    def collect_parameters(model)
      params_by_name = {}
      component_names = []
      seen_defn_ids = {}

      collect_from_definitions(model, params_by_name, component_names, seen_defn_ids)
      collect_from_entities(model.entities, model, params_by_name, component_names, seen_defn_ids)
      collect_from_selection(model, params_by_name, component_names, seen_defn_ids)
      add_params_referenced_in_formulas(model, params_by_name, component_names, seen_defn_ids)

      parameters = params_by_name.values.map do |p|
        options_export = export_options_with_colors(p[:options])
        {
          "name" => p[:name],
          "label" => p[:label],
          "unit" => p[:unit],
          "default" => p[:default],
          "min" => p[:min],
          "max" => p[:max],
          "options" => options_export,
          "effects" => p[:effects],
        }
      end

      material_names = collect_material_names_from_params(params_by_name)
      material_names_with_textures = collect_material_names_with_textures(model)
      material_names = (material_names + material_names_with_textures).uniq

      component_transforms = collect_component_transforms(model)

      {
        "parameters" => parameters,
        "components" => component_names.uniq.sort,
        "componentTransforms" => component_transforms,
        "materialColors" => {}, # Filled from model during export
        "materialNames" => material_names,
      }
    end

    private

    def get_dc_dict(entity_or_defn)
      return nil unless entity_or_defn
      ad = entity_or_defn.attribute_dictionaries
      return nil unless ad
      ad["dynamic_attributes"]
    end

    # Per-component: x, y, z, lenx, leny, lenz, material. Each is either a value or a formula string.
    def collect_component_transforms(model)
      transforms = {}
      seen_defn_ids = {}
      parent_map = {}

      collect_transforms_from_entities = lambda do |entities, parent_name|
        return unless entities
        entities.each do |ent|
          defn = ent.respond_to?(:definition) ? ent.definition : nil
          next unless defn
          dict = get_dc_dict(ent) || get_dc_dict(defn)
          next unless dict
          next if seen_defn_ids[defn.object_id]
          seen_defn_ids[defn.object_id] = true

          comp_name = defn.name.to_s.strip
          comp_name = "Group" if comp_name.empty?
          next if comp_name.empty?

          comp_name = normalize_mesh_node(comp_name)
          parent_map[comp_name] = parent_name if parent_name
          defn_dict = get_dc_dict(defn)
          transforms[comp_name] = extract_component_transform(dict, comp_name, defn_dict: defn_dict)
          collect_transforms_from_entities.call(defn.entities, comp_name)
        end
      end

      model.entities.each do |ent|
        defn = ent.respond_to?(:definition) ? ent.definition : nil
        next unless defn
        dict = get_dc_dict(ent) || get_dc_dict(defn)
        next unless dict
        next if seen_defn_ids[defn.object_id]
        seen_defn_ids[defn.object_id] = true

        comp_name = defn.name.to_s.strip
        comp_name = "Group" if comp_name.empty?
        next if comp_name.empty?

        comp_name = normalize_mesh_node(comp_name)
        defn_dict = get_dc_dict(defn)
        transforms[comp_name] = extract_component_transform(dict, comp_name, defn_dict: defn_dict)
        collect_transforms_from_entities.call(defn.entities, comp_name)
      end

      collect_from_selection_for_transforms(model, transforms, seen_defn_ids, parent_map)
      transforms.each do |name, t|
        t["_parent"] = parent_map[name] if parent_map[name]
      end
      transforms
    end

    def collect_from_selection_for_transforms(model, transforms, seen_defn_ids, parent_map)
      return if model.selection.empty?
      ent = model.selection[0]
      defn = ent.respond_to?(:definition) ? ent.definition : nil
      return unless defn
      dict = get_dc_dict(ent) || get_dc_dict(defn)
      return unless dict
      return if seen_defn_ids[defn.object_id]
      seen_defn_ids[defn.object_id] = true

      comp_name = defn.name.to_s.strip
      comp_name = "Group" if comp_name.empty?
      return if comp_name.empty?

      comp_name = normalize_mesh_node(comp_name)
      defn_dict = get_dc_dict(defn)
      transforms[comp_name] = extract_component_transform(dict, comp_name, defn_dict: defn_dict)
      collect_transforms_from_entities_for_selection(defn.entities, comp_name, transforms, seen_defn_ids, parent_map)
    end

    def collect_transforms_from_entities_for_selection(entities, parent_name, transforms, seen_defn_ids, parent_map)
      return unless entities
      entities.each do |ent|
        defn = ent.respond_to?(:definition) ? ent.definition : nil
        next unless defn
        dict = get_dc_dict(ent) || get_dc_dict(defn)
        next unless dict
        next if seen_defn_ids[defn.object_id]
        seen_defn_ids[defn.object_id] = true

        comp_name = defn.name.to_s.strip
        comp_name = "Group" if comp_name.empty?
        next if comp_name.empty?

        comp_name = normalize_mesh_node(comp_name)
        parent_map[comp_name] = parent_name
        defn_dict = get_dc_dict(defn)
        transforms[comp_name] = extract_component_transform(dict, comp_name, defn_dict: defn_dict)
        collect_transforms_from_entities_for_selection(defn.entities, comp_name, transforms, seen_defn_ids, parent_map)
      end
    end

    def extract_component_transform(dict, comp_name, defn_dict: nil)
      result = {}
      transform_keys = {
        "x" => %w[X x],
        "y" => %w[Y y],
        "z" => %w[Z z],
        "lenx" => %w[LenX lenx],
        "leny" => %w[LenY leny],
        "lenz" => %w[LenZ lenz],
        "width" => %w[width Width sirka],
        "height" => %w[height Height vyska],
        "depth" => %w[depth Depth hloubka],
        "material" => %w[Material material color barva],
      }

      dict_keys = dict.keys.map(&:to_s)
      dict_keys = (dict_keys + defn_dict.keys.map(&:to_s)).uniq if defn_dict
      transform_keys.each do |out_key, in_keys|
        key = in_keys.find { |k| dict_keys.include?(k.to_s) }
        next unless key

        formula = get_formula_from_dict(dict, key, defn_dict)
        unit = (dict["_#{key}_units"] || dict["_#{key}_formulaunits"]).to_s.strip
        unit = (defn_dict["_#{key}_units"] || defn_dict["_#{key}_formulaunits"]).to_s.strip if unit.empty? && defn_dict

        if formula != "" && formula !~ /^\s*$/
          # Formula (e.g. =parent!legs_color for material, =parent!height for lenz)
          result[out_key] = formula.start_with?("=") ? formula : "=#{formula}"
        else
          value = dict[key] || (defn_dict[key] if defn_dict)
          if out_key == "material"
            result[out_key] = value.to_s.strip
          else
            num = parse_number(value)
            # SketchUp returns inches for X,Y,Z and LenX,LenY,LenZ. Convert to cm.
            result[out_key] = num.nil? ? nil : (num * 2.54)
          end
        end
      end

      result
    end

    # Formulas for LenX/LenY/LenZ use _lenx_formula, _leny_formula, _lenz_formula (lowercase).
    # Same pattern as x,y,z: _x_formula, _y_formula, _z_formula.
    # Formulas are in the definition's dict, not the instance's. Try both dicts.
    def get_formula_from_dict(dict, key, defn_dict)
      key_str = key.to_s
      key_lower = key_str.downcase
      formula_keys = [
        "_#{key_lower}_formula",
        "_#{key_lower}_formlabel",
        "_#{key_str}_formula",
        "_#{key_str}_formlabel",
      ].uniq

      formula_keys.each do |fk|
        val = (dict[fk] || "").to_s.strip
        return val if val != ""

        val = (defn_dict[fk] || "").to_s.strip if defn_dict
        return val if val != ""
      end

      ""
    end

    # SketchUp adds #1, #2 to instance names. GLB export typically uses base name.
    def normalize_mesh_node(name)
      return name if name.nil? || name.to_s.empty?
      name.to_s.strip.sub(/#\d+$/, "")
    end

    def process_dc_dict(dict, defn, comp_name, model, params_by_name, component_names, seen_defn_ids)
      return unless dict
      return if seen_defn_ids[defn.object_id]
      seen_defn_ids[defn.object_id] = true

      comp_name = defn.name.to_s.strip
      comp_name = "Group" if comp_name.empty?
      component_names << comp_name if comp_name != "" && !component_names.include?(comp_name)

      dict.each_pair do |key, value|
        next if key.to_s.start_with?("_")

        param_name = key.to_s
        next if param_name.empty?

        formula = dict["_#{param_name}_formula"] || dict["_#{param_name}_formlabel"]
        formula_str = formula.to_s.strip

        label = (dict["_#{param_name}_label"] || dict["_#{param_name}_formlabel"] || param_name).to_s.strip
        unit = (dict["_#{param_name}_units"] || dict["_#{param_name}_formulaunits"] || "").to_s.strip
        options_str = (dict["_#{param_name}_options"] || "").to_s.strip
        options = parse_options(options_str)

        raw_default = parse_number(value)
        raw_min = parse_number(dict["_#{param_name}_min"])
        raw_max = parse_number(dict["_#{param_name}_max"])
        default_val = to_output_units(raw_default, unit, param_name)
        min_val = to_output_units(raw_min, unit, param_name)
        max_val = to_output_units(raw_max, unit, param_name)
        # Normalize unit to cm for dimension params (SketchUp API returns inches, we convert)
        out_unit = dimension_param?(param_name) ? "cm" : unit.to_s.strip

        effects = build_effects_for_param(
          param_name: param_name,
          formula_str: formula_str,
          comp_name: comp_name,
          model: model,
          defn: defn,
        )

        # Per-component params for scale: bottom_lenx, top_lenx so each mesh has its own dimensions.
        # Parent params (height, width) that drive child positions stay global.
        scale_only_on_self = scale_param?(param_name.downcase) && effects.all? { |e| e["meshNode"] == normalize_mesh_node(comp_name) }
        param_key = scale_only_on_self ? "#{normalize_mesh_node(comp_name)}_#{param_name}" : param_name

        if params_by_name[param_key]
          existing = params_by_name[param_key]
          existing[:effects].concat(effects)
          existing[:effects].uniq! { |e| [e["meshNode"], e["type"], e["axis"], (e["multiplier"] || 1), (e["offsetCm"] || 0)] }
          existing[:components] = (existing[:components] + [comp_name]).uniq
        else
          params_by_name[param_key] = {
            name: param_key,
            label: scale_only_on_self ? "#{comp_name} #{label}" : label,
            unit: out_unit,
            default: default_val,
            min: min_val,
            max: max_val,
            options: options,
            effects: effects,
            components: [comp_name],
          }
        end
      end
    end

    def collect_from_definitions(model, params_by_name, component_names, seen_defn_ids)
      model.definitions.each do |defn|
        next if defn.image?
        dict = get_dc_dict(defn)
        process_dc_dict(dict, defn, defn.name.to_s.strip, model, params_by_name, component_names, seen_defn_ids)
      end
    end

    def collect_from_entities(entities, model, params_by_name, component_names, seen_defn_ids)
      return unless entities
      entities.each do |ent|
        defn = nil
        if ent.is_a?(Sketchup::Group)
          defn = ent.definition
          dict = get_dc_dict(ent) || get_dc_dict(defn)
          process_dc_dict(dict, defn, defn.name.to_s.strip, model, params_by_name, component_names, seen_defn_ids)
          collect_from_entities(defn.entities, model, params_by_name, component_names, seen_defn_ids)
        elsif ent.is_a?(Sketchup::ComponentInstance)
          defn = ent.definition
          dict = get_dc_dict(ent) || get_dc_dict(defn)
          process_dc_dict(dict, defn, defn.name.to_s.strip, model, params_by_name, component_names, seen_defn_ids)
          collect_from_entities(defn.entities, model, params_by_name, component_names, seen_defn_ids)
        end
      end
    end

    def collect_from_selection(model, params_by_name, component_names, seen_defn_ids)
      return if model.selection.empty?
      ent = model.selection[0]
      defn = ent.respond_to?(:definition) ? ent.definition : nil
      return unless defn
      dict = get_dc_dict(ent) || get_dc_dict(defn)
      process_dc_dict(dict, defn, defn.name.to_s.strip, model, params_by_name, component_names, seen_defn_ids)
      collect_from_entities(defn.entities, model, params_by_name, component_names, seen_defn_ids)
    end

    # Add params referenced in formulas (e.g. sycek!avar, sycek!leny) that the parent lacks.
    # Default values come from the actual model: we read from child components that define the param.
    def add_params_referenced_in_formulas(model, params_by_name, component_names, _seen_defn_ids)
      collect_formula_references(model).each do |parent_defn_id, _comp_name, param_name|
        next if params_by_name[param_name]
        next if param_aliases(param_name).any? { |a| params_by_name[a] }

        defn = model.definitions.find { |d| d.object_id == parent_defn_id }
        next unless defn

        comp_name = defn.name.to_s.strip
        comp_name = "Group" if comp_name.empty?
        component_names << comp_name if comp_name != "" && !component_names.include?(comp_name)

        default_val, unit_from_child = find_default_from_model(defn, param_name)
        default_val = 0 if param_name.to_s.downcase == "avar" && default_val.nil?

        params_by_name[param_name] = {
          name: param_name,
          label: param_name.to_s.gsub(/([A-Z])/, " \\1").strip,
          unit: unit_from_child || "",
          default: default_val,
          min: nil,
          max: nil,
          options: [],
          effects: build_effects_for_param(
            param_name: param_name,
            formula_str: "",
            comp_name: comp_name,
            model: model,
            defn: defn,
          ),
          components: [comp_name],
        }
      end
    end

    # Find the param's value from a child that defines it (actual model state).
    # Returns [default_value, unit] or [nil, nil].
    def find_default_from_model(parent_defn, param_name)
      return [nil, nil] unless parent_defn&.entities

      parent_defn.entities.each do |ent|
        child_defn = ent.respond_to?(:definition) ? ent.definition : nil
        next unless child_defn

        dict = get_dc_dict(child_defn) || (ent.respond_to?(:attribute_dictionaries) ? get_dc_dict(ent) : nil)
        next unless dict

        # Match param by exact key or case-insensitive
        key = dict.keys.find { |k| !k.to_s.start_with?("_") && (k.to_s == param_name || k.to_s.casecmp(param_name).zero?) }
        next unless key

        value = dict[key]
        raw = parse_number(value)
        next unless raw

        unit = (dict["_#{key}_units"] || dict["_#{key}_formulaunits"] || "").to_s.strip
        return [to_output_units(raw, unit, param_name.to_s), unit]
      end
      [nil, nil]
    end

    def collect_formula_references(model)
      refs = []
      scan_formulas = lambda do |entities, parent_defn|
        return unless entities
        entities.each do |ent|
          defn = ent.respond_to?(:definition) ? ent.definition : nil
          next unless defn
          dict = get_dc_dict(defn) || (ent.respond_to?(:attribute_dictionaries) ? get_dc_dict(ent) : nil)
          if dict
            dict.each_pair do |key, _val|
              next if key.to_s.start_with?("_")
              formula = (dict["_#{key}_formula"] || dict["_#{key}_formlabel"]).to_s
              formula.scan(/(\w+)!\s*(\w+)/i) do |comp, param|
                refs << [parent_defn.object_id, parent_defn.name.to_s.strip, param] if parent_defn
              end
            end
          end
          scan_formulas.call(defn.entities, parent_defn)
        end
      end
      model.entities.each do |ent|
        defn = ent.respond_to?(:definition) ? ent.definition : nil
        next unless defn
        scan_formulas.call(defn.entities, defn)
      end
      refs.uniq
    end

    def default_save_path(model)
      model_path = model.path.to_s
      if model_path != "" && !model_path.empty?
        base = model_path.sub(/\.[^.]+$/, "")
        "#{base}.parameters"
      else
        "untitled.parameters"
      end
    end

    def default_configurator_export_path(model)
      model_path = model.path.to_s
      if model_path != "" && !model_path.empty?
        dir = File.dirname(model_path)
        base = File.basename(model_path.sub(/\.[^.]+$/, ""))
        File.join(dir, "#{base}_configurator.zip")
      else
        File.join(Dir.home, "configurator_export.zip")
      end
    end

    def create_zip_archive(source_dir, zip_path)
      if RUBY_PLATFORM =~ /mswin|mingw|cygwin/
        # PowerShell: cd to source, compress so zip has parameters.json and materials/ at root
        entries = ["parameters.json"]
        entries << "materials" if Dir.exist?(File.join(source_dir, "materials"))
        cmd = "Push-Location '#{source_dir.gsub("'", "''")}'; Compress-Archive -Path #{entries.map { |e| "'#{e}'" }.join(",")} -DestinationPath '#{zip_path.gsub("'", "''")}' -Force; Pop-Location"
        system("powershell -Command \"#{cmd}\"")
      else
        Dir.chdir(source_dir) do
          entries = ["parameters.json"]
          entries << "materials" if Dir.exist?("materials")
          system("zip -r '#{zip_path}' #{entries.map { |e| "'#{e}'" }.join(" ")}")
        end
      end
    end

    def parse_number(val)
      return nil if val.nil? || val.to_s.strip == ""
      Float(val)
    rescue ArgumentError, TypeError
      nil
    end

    # SketchUp LenX/LenY/LenZ are always in inches (Ruby API). Convert to cm for dimension params.
    def to_output_units(val, unit, param_name)
      return val if val.nil?
      return val unless dimension_param?(param_name)
      u = (unit || "").to_s.strip.upcase
      # SketchUp API returns inches regardless of model units. Always convert to cm.
      val * 2.54
    end

    def dimension_param?(name)
      n = name.to_s.downcase
      scale_param?(n) || n.include?("thickness") || n.include?("tloustka")
    end

    def parse_options(str)
      return [] if str.nil? || str.strip == ""
      junk = %w[&]
      str.split(/[,|;\s]+/).map(&:strip).reject(&:empty?).reject { |o| junk.include?(o) }.uniq
    end

    def build_effects_for_param(param_name:, formula_str:, comp_name:, model:, defn:)
      effects = []
      param_lower = param_name.to_s.downcase

      if material_param?(param_lower)
        target_nodes = material_target_meshes(param_name, defn)
        target_nodes.each { |n| effects << { "meshNode" => normalize_mesh_node(n), "type" => "material" } }
        return effects if target_nodes.any?
        effects << { "meshNode" => normalize_mesh_node(comp_name), "type" => "material" }
        return effects
      end

      if scale_param?(param_lower)
        axis = axis_for_scale_param(param_lower)
        if axis
          scale_targets = scale_target_meshes(param_name, defn)
          if scale_targets.any?
            scale_targets.each { |n| effects << { "meshNode" => normalize_mesh_node(n), "type" => "scale", "axis" => axis } }
          else
            effects << { "meshNode" => normalize_mesh_node(comp_name), "type" => "scale", "axis" => axis }
          end
        end
      end

      # Skip Parent! refs – find_child_effects adds those to the parent param.
      if formula_str =~ /(?:Parent|\w+)!\s*(\w+)/i && formula_str !~ /Parent!\s*\w+/i
        ref_param = Regexp.last_match(1)
        add_formula_effects(formula_str, ref_param, comp_name, effects)
      end

      param_names_to_check = [param_name] + param_aliases(param_name)
      find_child_effects(defn, param_names_to_check, comp_name, effects)

      effects.uniq { |e| [e["meshNode"], e["type"], (e["axis"] || ""), (e["multiplier"] || 1), (e["subtractParam"] || ""), (e["offsetCm"] || 0)] }
    end

    def add_formula_effects(formula_str, ref_param, comp_name, effects)
      multiplier = extract_multiplier_from_formula(formula_str) || 1.0
      subtract_param = extract_subtract_param_from_formula(formula_str)
      offset_cm = extract_offset_from_formula(formula_str)
      add_position = (multiplier != 1.0) || subtract_param || offset_cm
      if add_position && scale_param?(ref_param.downcase)
        axis = axis_for_param_name(ref_param) || "x"
        eff = {
          "meshNode" => normalize_mesh_node(comp_name),
          "type" => "position",
          "axis" => axis,
          "multiplier" => multiplier,
        }
        eff["subtractParam"] = subtract_param if subtract_param
        eff["offsetCm"] = offset_cm if offset_cm && offset_cm != 0
        effects << eff
      elsif !add_position && scale_param?(ref_param.downcase)
        axis = axis_for_scale_param(ref_param.downcase)
        effects << { "meshNode" => normalize_mesh_node(comp_name), "type" => "scale", "axis" => axis } if axis
      end
    end

    def material_param?(name)
      MATERIAL_PARAMS.any? { |p| name.include?(p.downcase) }
    end

    # Derive target mesh from param name: bottom_color->bottom, top_color->top, legs_color->leg1+leg2, default->default
    def material_target_meshes(param_name, parent_defn)
      name = param_name.to_s.downcase
      return [] unless name.include?("color") || name.include?("barva") || name.include?("material")
      if name.include?("bottom") || name.include?("podstavec")
        return child_names_matching(parent_defn, /bottom/i)
      end
      if name.include?("top") || name.include?("deska")
        return child_names_matching(parent_defn, /top/i)
      end
      if name.include?("leg") || name.include?("noha")
        return child_names_matching(parent_defn, /leg\d*/i)
      end
      if name.include?("default")
        return child_names_matching(parent_defn, /default/i)
      end
      []
    end

    def child_names_matching(parent_defn, pattern)
      return [] unless parent_defn&.entities
      parent_defn.entities.filter_map do |ent|
        defn = ent.respond_to?(:definition) ? ent.definition : nil
        next unless defn
        n = defn.name.to_s.strip
        n.empty? ? nil : n
      end.select { |n| pattern.match?(n) }
    end

    # Which meshes to scale for a param: top_thickness→top, bottom_thickness→bottom, width/depth→top+bottom.
    def scale_target_meshes(param_name, parent_defn)
      name = param_name.to_s.downcase
      if name.include?("top") && (name.include?("thickness") || name.include?("tloustka"))
        return child_names_matching(parent_defn, /top/i)
      end
      if (name.include?("bottom") || name.include?("podstavec")) &&
         (name.include?("thickness") || name.include?("tloustka"))
        return child_names_matching(parent_defn, /bottom/i)
      end
      if name == "width" || name == "sirka" || name == "lenx" || name == "depth" || name == "hloubka" || name == "lenz"
        top = child_names_matching(parent_defn, /top/i)
        bottom = child_names_matching(parent_defn, /bottom/i)
        return (top + bottom).uniq
      end
      []
    end

    def export_options_with_colors(options)
      return [] if options.nil? || options.empty?
      options.map do |opt|
        name = opt.to_s.strip
        next nil if name.empty?
        { "value" => name, "label" => name.sub(/\A\w/, &:capitalize) }
      end.compact
    end

    def collect_material_names_from_params(params_by_name)
      names = []
      params_by_name.each_value do |p|
        next unless material_param?(p[:name].to_s.downcase)
        (p[:options] || []).each do |opt|
          n = opt.to_s.strip
          names << n if !n.empty? && !names.include?(n)
        end
      end
      names
    end

    # Also collect materials with textures from the model (PNG preferred over hex).
    def collect_material_names_with_textures(model)
      names = []
      model.materials.each do |mat|
        next if mat.name.to_s.strip.empty?
        names << mat.name.to_s.strip if mat.texture
      end
      names
    end

    # SketchUp internal materials to skip when exporting all.
    SKIP_MATERIAL_PATTERNS = [/^Layer_\d+/i, /^Default$/i].freeze

    # Export materials from SketchUp model: save textures as PNG, get colors for solids.
    # When material_names is empty, exports ALL model materials (except Layer_*, Default).
    # Returns { "oak" => { "texturePath" => "materials/oak.png" }, "black" => { "colorHex" => "#1A1A1A" } }
    def export_materials_from_model(model, material_names, export_dir)
      materials_dir = File.join(export_dir, "materials")
      FileUtils.mkdir_p(materials_dir)

      # Always export all model materials (except internal).
      names_to_export = model.materials.map { |m| m.name.to_s.strip }.reject(&:empty?)

      result = {}
      model.materials.each do |mat|
        mat_name = mat.name.to_s.strip
        next if mat_name.empty?
        next if SKIP_MATERIAL_PATTERNS.any? { |pat| pat.match?(mat_name) }
        next unless names_to_export.any? { |n| n.to_s.strip.casecmp(mat_name).zero? }

        key = names_to_export.find { |n| n.to_s.strip.casecmp(mat_name).zero? }.to_s
        if mat.texture
          safe_name = mat_name.gsub(/[^\w\-.]/, "_")
          png_path = File.join(materials_dir, "#{safe_name}.png")
          if mat.texture.write(png_path, true)
            result[key] = { "texturePath" => "materials/#{safe_name}.png" }
          else
            result[key] = color_to_hex(mat.color)
          end
        else
          result[key] = color_to_hex(mat.color)
        end
      end

      result
    end

    def color_to_hex(color)
      return {} unless color
      r = (color.red || 0).to_i.clamp(0, 255)
      g = (color.green || 0).to_i.clamp(0, 255)
      b = (color.blue || 0).to_i.clamp(0, 255)
      { "colorHex" => format("#%02X%02X%02X", r, g, b) }
    end

    def scale_param?(name)
      SCALE_PARAMS.any? { |p| p.downcase == name } ||
        name == "width" || name == "sirka" ||
        name == "depth" || name == "hloubka" ||
        name == "height" || name == "vyska" ||
        name == "thickness" || name == "tloustka"
    end

    def axis_for_scale_param(name)
      case name
      when "lenx", "width", "sirka" then "x"
      when "leny", "height", "vyska" then "y"
      when "lenz", "depth", "hloubka" then "z"
      when "prumer", "průměr" then "xz"
      when "thickness", "tloustka" then "y"
      else nil
      end
    end

    def axis_for_param_name(name)
      axis_for_scale_param(name.downcase)
    end

    def param_aliases(name)
      return [] if name.nil? || name.to_s.empty?
      key = name.to_s.downcase
      PARAM_ALIASES[key] || PARAM_ALIASES.values.find { |aliases| aliases.any? { |a| a.downcase == key } }&.reject { |a| a.downcase == key } || []
    end

    def extract_multiplier_from_formula(formula)
      return nil if formula.nil? || formula.empty?
      if formula =~ %r{/\s*(\d+\.?\d*)}
        return 1.0 / Float(Regexp.last_match(1))
      end
      if formula =~ /\*\s*(\d+\.?\d*)/
        return Float(Regexp.last_match(1))
      end
      nil
    end

    # Extracts param name subtracted in formulas like (parent!height-LenY)/2.
    # Returns e.g. "LenY" when formula contains -LenY (child's own param).
    def extract_subtract_param_from_formula(formula)
      return nil if formula.nil? || formula.empty?
      # Match -ParamName (letter followed by alphanumeric, not a number)
      m = formula.match(/-\s*([A-Za-z][A-Za-z0-9_]*)/)
      m ? m[1] : nil
    end

    # Extracts constant offset from formulas like parent!width-LenX-1.
    # SketchUp uses inches; returns value in cm.
    def extract_offset_from_formula(formula)
      return nil if formula.nil? || formula.empty?
      # Match trailing -N or +N (constant)
      m = formula.match(/([+-])\s*(\d+\.?\d*)\s*$/)
      return nil unless m
      sign = m[1] == "-" ? -1 : 1
      val = sign * Float(m[2])
      val * 2.54
    end

    def find_child_effects(parent_defn, param_names_to_check, parent_comp_name, effects)
      return unless parent_defn.entities

      parent_defn.entities.each do |ent|
        child_defn = ent.respond_to?(:definition) ? ent.definition : nil
        next unless child_defn

        child_dict = get_dc_dict(child_defn) || (ent.respond_to?(:attribute_dictionaries) ? get_dc_dict(ent) : nil)
        next unless child_dict

        child_name = child_defn.name.to_s.strip
        child_name = "Group" if child_name.empty?
        next if child_name.empty?

        child_dict.each_pair do |key, _val|
          next if key.to_s.start_with?("_")
          formula = (child_dict["_#{key}_formula"] || child_dict["_#{key}_formlabel"]).to_s
          next if formula.empty?

          refs_param = param_names_to_check.any? do |pn|
            formula =~ /Parent!\s*#{Regexp.escape(pn)}/i || formula =~ /(\w+)!\s*#{Regexp.escape(pn)}/i
          end
          next unless refs_param

          parent_param = param_names_to_check.first
          multiplier = extract_multiplier_from_formula(formula) || 1.0
          subtract_param = extract_subtract_param_from_formula(formula)
          offset_cm = extract_offset_from_formula(formula)
          add_position = (multiplier != 1.0) || subtract_param || offset_cm
          if add_position && scale_param?(parent_param.downcase)
            axis = axis_for_param_name(parent_param) || "x"
            eff = {
              "meshNode" => normalize_mesh_node(child_name),
              "type" => "position",
              "axis" => axis,
              "multiplier" => multiplier,
            }
            eff["subtractParam"] = subtract_param if subtract_param
            eff["offsetCm"] = offset_cm if offset_cm && offset_cm != 0
            effects << eff
          elsif !add_position && scale_param?(parent_param.downcase)
            axis = axis_for_scale_param(parent_param.downcase)
            effects << { "meshNode" => normalize_mesh_node(child_name), "type" => "scale", "axis" => axis } if axis
          end
        end
      end
    end
  end
end

unless file_loaded?(__FILE__)
  menu = UI.menu("Plugins").add_submenu("Configurator")
  menu.add_item("Export for Configurator (zip + GLB)") do
    ConfiguratorDcExport.export_parameters
  end
  menu.add_item("Debug: Show what plugin finds") do
    ConfiguratorDcExport.debug_run
  end
  file_loaded(__FILE__)
end
