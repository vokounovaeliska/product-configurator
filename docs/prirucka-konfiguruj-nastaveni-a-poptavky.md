# Konfiguruj: příručka k nastavení a poptávkám

Tato příručka je určena uživatelům, kteří v aplikaci **Konfiguruj** připravují konfigurovatelné produkty, publikují je na webu a zpracovávají **cenové poptávky** od zákazníků. Text předpokládá, že máte vytvořený uživatelský účet a po přihlášení přístup do sekce **Nastavení**.

Veřejná úvodní stránka aplikace shrnuje základní princip práce: připravit model produktu, nastavit jeho konfiguraci, zveřejnit jej a následně přijímat poptávky z vloženého konfigurátoru na webu.

![Úvodní stránka Konfiguruj s přehledem „Jak to funguje“](images/prirucka/04-domovska-stranka.png)

Do administrace vstoupíte přes volbu **Přihlásit** v hlavičce nebo prostřednictvím odkazu z úvodní stránky. Po úspěšném přihlášení se zobrazí interní část aplikace se sekcí **Nastavení**.

![Obrazovka přihlášení](images/prirucka/02-prihlaseni.png)

---

## Co v aplikaci spravujete

V aplikaci spravujete především **modely produktů**, tedy jednotlivé výrobky, které bude zákazník na webu konfigurovat. U každého modelu následně určujete jeho strukturu, konkrétně **komponenty**, **atributy**, **možnosti**, **ceny** a případně také **cenová pravidla**. Součástí práce je i **publikování** konfigurátoru, jeho vložení na vlastní web a následné vyřizování **poptávek**, které z vloženého formuláře přijdou. Pro celý účet se navíc nastavují společné oblasti, například **e-mailové šablony a notifikace**.

---

## Orientace v sekci Nastavení

Po přihlášení otevřete sekci **Nastavení**. Levé menu slouží jako hlavní navigace mezi jednotlivými obrazovkami administrace. Každá položka odpovídá jedné části pracovního procesu.

- **Dashboard** slouží jako úvodní přehled administrace. Najdete zde rychlé vstupy do nejčastějších činností, například k importu modelu nebo k přehledu poptávek.
- **Modely produktů** obsahují seznam všech konfigurovatelných výrobků. Na této obrazovce můžete vytvářet nové modely, upravovat existující, otevírat jejich správu a kontrolovat jejich náhled.
- **Import ze SketchUp** slouží k nahrání ZIP souboru vytvořeného exportním pluginem. Tato obrazovka je výchozím bodem pro založení nového modelu produktu.
- **Poptávky** zobrazují žádosti, které zákazníci odeslali z vloženého konfigurátoru. K dispozici je seznam, filtrování i detail jednotlivých záznamů.
- **E-mail a notifikace** slouží ke správě šablon a adres používaných při komunikaci se zákazníkem i se správcem konfigurátoru.

Po otevření konkrétního modelu produktu dále pracujete s jeho vlastními obrazovkami a záložkami, typicky **Obecné**, **Ceny**, **Publikování** a **Náhled**. V rámci správy modelu také vstupujete do struktury produktu, kde se nastavují **Komponenty**, **Atributy**, **Možnosti** a jejich ceny.

Na následujícím obrázku je příklad seznamu modelů produktů v administraci:

![Seznam modelů produktů v Nastavení](images/prirucka/06-modely-produktu.png)

Po stisku tlačítka **Spravovat** se otevře detail zvoleného modelu. Ten je rozdělen do několika záložek, které odpovídají různým oblastem nastavení.

![Záložka Obecné: struktura modelu a základní nastavení](images/prirucka/10-detail-modelu-obecne.png)

![Záložka Ceny: cenová pravidla a finanční logika modelu](images/prirucka/10-detail-modelu-ceny.png)

![Záložka Publikování: veřejný embed a související nastavení](images/prirucka/10-detail-modelu-publikovani.png)

![Záložka Náhled: kontrola chování konfigurátoru](images/prirucka/10-detail-modelu-nahled.png)

---

## Obrazovka Modely produktů

Obrazovka **Modely produktů** slouží jako centrální seznam všech výrobků, které chcete v systému nabízet. Každá položka představuje jeden konfigurovatelný produkt, například konkrétní typ stolu, postele nebo jiného výrobku na míru.

Nový model vytvoříte v sekci **Nastavení** → **Modely produktů** pomocí tlačítka **Vytvořit model**, případně přes prázdný stav **Vytvořit první model**, pokud v účtu zatím žádný model není. Samotný obsah modelu se běžně zakládá importem ze SketchUp. Úplné vytvoření produktu pouze ručně v administraci bez importovaného modelu zatím není standardní postup.

U každého modelu můžete otevřít akci **Upravit**, ve které se nastavují základní údaje, například název, popis, **základní cena**, **měna** a přepínač **Aktivní**. Tento přepínač určuje, zda je model připraven k používání v dalších částech aplikace a zda jej lze prezentovat zákazníkům.

Z kartičky nebo řádku modelu obvykle pokračujete některou z těchto akcí:

- **Náhled** otevře konfigurátor v podobě, ve které jej uvidí zákazník. Tato obrazovka je vhodná pro kontrolu funkčnosti, zobrazení i výpočtu ceny.
- **Spravovat** otevře detail modelu a jeho vnitřní strukturu. Právě zde nastavujete komponenty, atributy, možnosti a další logiku produktu.
- **Smazat** trvale odstraní celý model. Tuto akci používejte pouze tehdy, pokud si jste jisti, že daný záznam již nebude potřeba.

---

## Jak je produkt v aplikaci strukturován

Konfigurace produktu je v administraci rozdělena do několika navazujících vrstev. Toto členění odpovídá tomu, co zákazník později vybírá ve veřejném konfigurátoru.

1. **Komponenty** představují části produktu nebo logické celky modelu, například korpus, desku, nohy nebo úložný prostor. V této části má význam dbát na srozumitelné názvy a přehledné pořadí.
2. **Atributy** popisují vlastnosti konkrétní komponenty, například barvu, materiál, šířku nebo typ povrchu. U atributu nastavujete název pro uživatele, interní **kód**, typ hodnoty, případně rozsah, jednotku, povinnost vyplnění a pořadí.
3. **Možnosti** se používají zejména u výčtových atributů. Představují jednotlivé volby, ze kterých si zákazník vybírá, například konkrétní dekor nebo variantu provedení.
4. **Ceny** určují příplatky nebo cenové dopady jednotlivých možností a hodnot.
5. **Cenová pravidla** slouží pro složitější cenovou logiku na úrovni celého modelu, pokud nestačí základní nastavení cen u jednotlivých položek.

Po importu ze SketchUp bývá tato struktura předvyplněná výchozí podobou modelu. Doporučuje se ji vždy zkontrolovat a upravit tak, aby odpovídala tomu, jak má být produkt prezentován zákazníkovi.

---

## Detail modelu produktu

Po otevření detailu modelu pracujete s několika záložkami, z nichž každá pokrývá jinou část správy produktu.

### Obecné

Záložka **Obecné** slouží ke správě struktury modelu a jeho základních prvků. Z této části zpravidla vstupujete do komponent, atributů a možností. Je to hlavní pracovní obrazovka pro sestavení logiky konfigurace.

### Ceny

Záložka **Ceny** slouží ke správě cenové logiky modelu. Kromě základních cen jednotlivých položek zde mohou být dostupná i **cenová pravidla**, pokud produkt vyžaduje složitější výpočty nebo podmínky.

### Publikování

Záložka **Publikování** slouží k přípravě modelu pro veřejné použití. Právě zde určujete, zda bude model zveřejněn, jakou bude mít veřejnou URL adresu pro embed a jaký kód vložíte do vlastního webu.

### Náhled

Záložka **Náhled** umožňuje ověřit finální chování konfigurátoru. Před publikováním je vhodné zde zkontrolovat, zda se správně zobrazují komponenty, zda mají atributy očekávané pořadí a zda výsledná cena odpovídá nastavení.

---

## Publikování konfigurátoru na web

Pokud je model připraven, otevřete jeho záložku nebo stránku **Publikovat a vložit**. Zde zapnete stav **Publikováno**, nastavíte **Embed URL** a následně zkopírujete připravený **iframe kód** do svého webu.

Pole **Embed URL** určuje jedinečnou veřejnou cestu konfigurátoru. Obvykle se používají malá písmena, číslice a pomlčky. Formát výsledné adresy je uveden přímo u pole, například ve tvaru `/e/.../vas-retezec`. Hodnota by měla být v rámci vašich produktů jednoznačná.

Na stejné obrazovce lze vyplnit také **e-mail pro notifikace** vztahující se ke konkrétnímu modelu. Pokud je toto pole vyplněné, může se použít například jako adresa Reply-To v potvrzovacím e-mailu pro zákazníka nebo jako cílová adresa pro nové poptávky. Pokud pole zůstane prázdné, obvykle se použije e-mail nastavený u účtu.

### Nastavení náhledu ve vloženém režimu

V části **Nastavení náhledu** můžete určit, jak se bude veřejný konfigurátor zobrazovat po vložení na web. Podle dostupných voleb lze řídit například zobrazení názvu produktu, popisu, výběru komponent, výchozí **zoom** nebo úhly kamery. Změny ukládejte vždy podle tlačítek a pokynů uvedených přímo na obrazovce.

Bez zapnutého publikování zpravidla nebude možné konfigurátor ve veřejném embed režimu používat.

---

## E-mail a notifikace

Obrazovka **E-mail a notifikace** v sekci **Nastavení** slouží ke správě komunikace pro celý účet. Na tomto místě upravujete zejména šablony e-mailů, které se použijí po odeslání cenové poptávky.

Typicky zde nastavujete:

- e-mail pro zákazníka po odeslání poptávky,
- e-mail pro správce nebo obchodní kontakt při přijetí nové poptávky.

U některých modelů lze v části **Publikovat a vložit** provést ještě doplňující nastavení konkrétních šablon. Přesný rozsah závisí na tom, které volby daná instance aplikace zobrazuje.

---

## Obrazovka Poptávky

Poptávky vznikají ve chvíli, kdy návštěvník odešle formulář z vloženého konfigurátoru. Každá odeslaná žádost se automaticky uloží do sekce **Nastavení** → **Poptávky** a podle nastavení může zároveň vyvolat odeslání e-mailové notifikace.

### Seznam poptávek

Na hlavní obrazovce poptávek pracujete se seznamem všech přijatých záznamů. K dispozici je pole **Hledat**, které slouží k vyhledávání podle jména zákazníka, názvu produktu nebo e-mailové adresy. Dále můžete používat filtry podle **stavu**, produktu a data. Tlačítko **Vymazat filtry** vrátí seznam do výchozího stavu. Pokud je záznamů více, pokračujete tlačítkem **Načíst další**.

![Seznam poptávek (příklad)](images/prirucka/08-poptavky.png)

### Detail poptávky

Po otevření konkrétní položky se zobrazí detail poptávky. Ten obvykle obsahuje kontaktní údaje zákazníka, jeho zprávu, název produktu, cenu v okamžiku odeslání a přehled zvolené konfigurace. Detail slouží jako pracovní podklad pro další komunikaci a interní zpracování.

### Stav poptávky

Součástí evidence je také **stav** poptávky. Běžně se používají hodnoty jako **Nová**, **Rozpracováno**, **Nabídka odeslána** nebo **Uzavřeno**. Stav je určen především pro interní práci a pomáhá udržet přehled o tom, v jaké fázi se jednotlivé žádosti nacházejí.

### Smazání poptávky

Smazání poptávky je trvalé a nelze je vrátit zpět. Tuto akci doporučujeme používat pouze v odůvodněných případech, například při mazání testovacích dat nebo omylem vytvořených záznamů.

---

## Doporučený pracovní postup

Při zakládání nového produktu je vhodné postupovat v tomto pořadí:

1. Importovat model ze SketchUp pomocí připraveného ZIP souboru.
2. Zkontrolovat a upravit komponenty, atributy, možnosti a ceny.
3. Ověřit chování konfigurátoru v záložce **Náhled**.
4. V části **Publikovat a vložit** zapnout publikování, nastavit veřejnou URL a vložit iframe na vlastní web.
5. Přijaté žádosti průběžně vyřizovat v sekci **Poptávky** a aktualizovat jejich stav.

---

## Import ze SketchUp

Do konfigurátoru nahráváte **zip z exportního pluginu** (menu SketchUp **Pluginy → Konfiguruj Export → Export for Konfiguruj**). V zipu jsou vždy soubory **model.glb** a **parameters.json**. Obrázky textur (PNG nebo JPEG) plugin přidá jen pokud je model potřebuje, často pod cestami typu `materials/…`, ale **pevná složka `materials` v zipu být nemusí**, pokud se žádné textury neexportují. Konfigurátor z zipu načte model, parametry a nalezené obrázky.

Veřejný text **Návod k pluginu SketchUp** je v aplikaci na cestě `/cs/tutorial`, anglická verze na `/en/tutorial`. V běžící instanci na něj narazíte z menu nebo z Dashboardu, případně zadejte do prohlížeče úplnou adresu ve tvaru `https://<vaše-doména>/cs/tutorial` (na produkčním webu Konfiguruj například `https://www.konfiguruj.com/cs/tutorial`). Návod popisuje instalaci pluginu (soubor `.rbz`), práci s Dynamic Components a přípravu exportu. Obsah odpovídá logice aplikace, nemusí jít o doslovný přepis každého kroku ve vaší verzi SketchUp.

Po přihlášení spustíte import v **Nastavení** v položce **Import ze SketchUp** (cesta v aplikaci `/cs/setup/import/sketchup`). Vyberete configurator zip a případně doplníte název produktu, na stránce je i nápověda ke stažení pluginu. Úplná adresa je opět `https://<vaše-doména>/cs/setup/import/sketchup`.

Na **Dashboardu** (úvod **Nastavení**) je rámeček **Tip: Příprava 3D modelu** s tlačítky na stažení pluginu a na stejný návod. Vše používá doménu vaší instance, při lokálním vývoji typicky `http://localhost:3001/cs/tutorial` a `http://localhost:3001/cs/setup/import/sketchup`.

![Návod k pluginu SketchUp v aplikaci (příklad zobrazení)](images/prirucka/01-tutorial-sketchup.png)

---

## Řešení problémů

Pokud se objeví problémy s přihlášením, oprávněními nebo ukládáním dat, doporučujeme obrátit se na správce účtu nebo na dodavatele systému. Pro obecný kontakt lze využít také formulář na stránce **Kontakt**, která je dostupná z hlavičky webu.

![Stránka Kontakt](images/prirucka/03-kontakt.png)
