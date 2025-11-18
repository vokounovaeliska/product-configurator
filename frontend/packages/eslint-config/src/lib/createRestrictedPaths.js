import fs from "fs";
import path from "path";

/**
 * Custom plugin to enforce unidirectional codebase according to Bulletproof React architecture
 * see https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
 * @param {string} featuresDir
 */
export function createRestrictedPathsPlugin(featuresDir) {
  /**
   * Get all feature directories in the src/features directory
   * @returns {string[]}
   */
  function getFeatureDirs() {
    const contents = fs.readdirSync(featuresDir);
    const directories = contents.filter((item) => {
      const fullPath = path.join(featuresDir, item);
      return fs.statSync(fullPath).isDirectory();
    });
    return directories;
  }

  /**
   * Create restricted paths for eslint-plugin-import
   * @returns {import("eslint").Linter.RulesRecord["import/no-restricted-paths"][1]["zones"]}
   */
  function createRestrictedPaths() {
    const features = getFeatureDirs();
    return features.map((feature) => ({
      target: `${featuresDir}/${feature}`,
      from: featuresDir,
      except: [`./${feature}`],
    }));
  }

  return createRestrictedPaths;
}
