const scraperObject = {
	url: 'https://www.lapprenti.com/annuaire/sdom_cfa.asp',
	async scraper(browser){
		let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		await page.goto(this.url);
		
        const AnnuaireSelector = '#tabannuaire';
        await page.waitForSelector(AnnuaireSelector, { visible: true });

        const hrefListHome = await page.$$eval('#tabannuaire .media-body a', elems => {
            return elems.map(elem => elem.href); // Récupère le lien href de chaque élément
        });
        
        //console.log(hrefListHome); // Affiche la liste des href
        let Hreflistedepartment1=[];

        for (let href of hrefListHome) {
            console.log(`Navigating to: ${href}`);
            
            // Naviguer vers chaque lien
            let newPage = await browser.newPage();
            await newPage.goto(href);

            const departementSelector = '.list-group a';  // Utilisez la bonne classe ici

            const elementExists = await newPage.$(departementSelector) !== null;

            if (elementExists) {
                console.log('L\'élément existe sur la page.');
                // Continuez avec d'autres actions si l'élément existe
            } else {
                console.log('L\'élément n\'existe pas sur la page.');
            }

            // Petite pause pour éviter de surcharger le serveur
            

            const hrefListDepartement = await newPage.$$eval('.xbox.longtitle ul.list-group a.list-group-item', elems => {
                return elems.map(elem => elem.href); // Récupère le lien href de chaque élément
            });

            console.log(hrefListDepartement);
            Hreflistedepartment1.push(...hrefListDepartement);

            /*

                const hrefCount = await newPage.$$eval('ul.list-group a.list-group-item', elems => {
                    return elems.length; // Retourne le nombre d'éléments
                });
                
                console.log('Nombre de href trouvés : ' + hrefCount);*/

            
            // Vous pouvez ajouter ici d'autres actions à effectuer sur chaque page
            await newPage.close();

        }

        let cfaList = []; // Tableau pour stocker tous les résultats CFA

        for (let href of Hreflistedepartment1) {
            console.log(`Navigating to: ${href}`);
            
            // Ouvre une nouvelle page pour chaque lien
            let newPage = await browser.newPage();
            await newPage.goto(href);
            
            const cfa = await newPage.evaluate(() => {
                // Sélectionner tous les éléments avec la classe .UaQhfb
                const containerElements = document.querySelectorAll('.divcfa.lapplist');

                // Convertir la NodeList en tableau et mapper chaque élément
                return Array.from(containerElements).map(container => {
                    // Sélectionner le titre dans .UsdlK à l'intérieur de chaque conteneur
                    const NameElement = container.querySelector('h2');
                    const Name = NameElement ? NameElement.innerText : 'N/A';

                    const InformationElement = container.querySelector('p.cfa_service');
                    const Information = InformationElement ? InformationElement.innerText : 'N/A';

                    const infoPattern = /^(.*?)-\s*(.*),\s*(\d{5})\s*(.*)$/;
                    const match = Information.match(infoPattern);

                    let Tel = 'N/A';
                    let Adresse = 'N/A';
                    let Ville = 'N/A';

                    if (match) {
                        Tel = match[1].trim(); // Partie avant le tiret : Téléphone
                        Adresse = match[2].trim(); // Partie après le tiret jusqu'au code postal : Adresse
                        Ville = match[4].trim(); // Partie après le code postal : Ville
                    }

                    // Scrapper la description contenue dans la div .cfacomment
                    const descriptionElement = container.querySelector('.cfacomment');
                    let description = 'N/A';

                    if (descriptionElement) {
                        // Extraire le texte directement inséré dans la div
                        const directText = Array.from(descriptionElement.childNodes)
                            .filter(node => node.nodeType === Node.TEXT_NODE)
                            .map(node => node.textContent.trim())
                            .filter(text => text.length > 0) // Ignorer les textes vides
                            .join('\n');

                        // Extraire le contenu textuel des <h4>, <p>, et <ul> dans la description
                            const h4Text = Array.from(descriptionElement.querySelectorAll('h4')).map(h4 => h4.innerText).join('\n');
                            const pText = Array.from(descriptionElement.querySelectorAll('p')).map(p => p.innerText).join('\n');
                            const ulText = Array.from(descriptionElement.querySelectorAll('ul')).map(ul => {
                                return Array.from(ul.querySelectorAll('li')).map(li => li.innerText).join(', ');
                            }).join('\n');

                        // Combiner tout le contenu
                            description = `${directText}\n${h4Text}\n${pText}\n${ulText}`.trim();

                            // Sélectionner le site web via le data-href de la balise <a class="web btn btn-primary">
                            
                        }
                        const websiteElement = container.querySelector('a.web.btn.btn-primary');
                        const website = websiteElement ? websiteElement.getAttribute('data-href') : 'N/A';


                

                    // Vérifier si l'élément existe et récupérer le href


                    // Retourner un objet avec le titre, le numéro et le lien (si trouvé)
                    return {
                        Name: Name,
                        Tel: Tel,
                        Adresse: `${Adresse}, ${match ? match[3] : ''} ${Ville}`, // Combine l'adresse et le code postal
                        Ville: Ville,
                        Description: description, // Ajout de la description extraite
                        Website: website // Ajout du lien du site web
                        
                    };
                });
            });
            // Ajoutez ici d'autres actions à effectuer sur chaque page
            // Par exemple, vous pouvez attendre un sélecteur ou extraire des informations
            cfaList.push(...cfa); // Ajoute les résultats dans le tableau cfaList

            await newPage.close(); // Ferme la page après traitement
        }

        const uniqueCfaList = cfaList.filter((item => {
            const seenNames = new Set();
            return item => {
                if (seenNames.has(item.Name.trim())) {
                    return false;
                }
                seenNames.add(item.Name.trim());
                return true;
            };
        })());

        return uniqueCfaList;
	}
}

module.exports = scraperObject;