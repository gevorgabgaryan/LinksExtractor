/* For extracting links in this app used  axios and puppetter
puppeter used for extracting links
axios used for getting links statuses
*/
import axios from 'axios';
import puppeteer from 'puppeteer';
//for entry other link after npm start type that link or change in line 9 link
let entryUrl=process.argv[2] || `https://hexometer.com/`;
let checkedLinkSet=new Set();
let displayadLinksSet=new Set();

(async ()=>{
   try{ 
    let urlObj=new URL(entryUrl)
    let domain=`${urlObj.origin}`;
  
    //function for geting links with statsuses    
    checkedLinkSet.add(domain)
   let allLinksMap=await linskAndStatuses(domain);
   
   console.log(`--------Main Page Links With Statuses------------`);
      //diplaying links and statsus
      for(let item of allLinksMap.entries()){   
        for(let link of item[1]){
            displayadLinksSet.add(link)
            console.log(`%s status is %d`,link,item[0]);
        }
       
      }
      console.log(`-------Links count by Status Code------------`);
      //diplaying link counts according statusCode
      for(let item of allLinksMap.entries()){   
        console.log(`${item[0]} linkcount is ${item[1].length}` );
      
      }
      //finding links of other pages//
      Array.from(displayadLinksSet).forEach(async link=>{
          if(!checkedLinkSet.has(link) && link.includes(domain)){
            checkedLinkSet.add(link)
             let otherPageMap= await linskAndStatuses(link);
                //diplaying links and statsus
                for(let item of otherPageMap.entries()){   
                    for(let link of item[1]){
                       if(!displayadLinksSet.has(link)){
                         displayadLinksSet.add(link)
                         console.log(`---${link}---------`);
                         console.log(`%s status is %d`,link,item[0]);   
                       } 
                       
                    }
       
             }
          }
      }) 
      
    
   }catch(err){
       console.log(err.message);
   }  
 })()




 //function extratcting links

 async  function  extractingLinksFromUrl(url){
     let entryUrl=url
       //creating browser Instance
       const browser = await puppeteer.launch({
        headless:true
      })
    //new page instance in the browser  
    const page = await browser.newPage();
    //to navigate to  entryURL
    await page.goto(entryUrl,{waitUntil: 'load', timeout: 0});

      // retruning links
      return await page.evaluate(() => {
        //for escaping duplicats used Set
        let links=new Set();
        // get the achor tags of document
        let linksElms = document.querySelectorAll('a');
        // adding linsk to Set
        linksElms.forEach((linkElement) => {  
          if(linkElement){
            links.add(linkElement.href);
          }            
                        
        }); 
             
        //returnig extracted links 
         return Array.from(links);
       });
  
 }


 async function linskAndStatuses(url){
     //map for collectiong links and statsutsus
     //keys is statuses values array with from that statuses links
    let allLinksMap = new Map();
    // getting links  from url
    let linksFromUrl=await extractingLinksFromUrl(url)
   // crating promises array for extracting statuses
    let values=await Promise.all(linksFromUrl.map(link=>{
        if(validURL(link)){
            return axios.get(link, {validateStatus: () => true}) 
        }     
    
    }))
    // inserting map liks and statuses
    values.forEach(value=>{
        if(value && value.status){
            //checkig is exist in map statsus
           if(allLinksMap.has(value.status)){
            allLinksMap.get(value.status).push(value.config.url)
           }else{
               //creating new status with value array containg url
             allLinksMap.set(value.status,[value.config.url])
           }  
        }
           
    });
    // retrungin map with links and statuses
     return allLinksMap

 }


   //is valid url
   function validURL(str) {
    let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }