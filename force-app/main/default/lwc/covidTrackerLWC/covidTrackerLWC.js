import { LightningElement,track } from 'lwc';

const apiURL = "https://services9.arcgis.com/N9p5hsImWXAccRNI/arcgis/rest/services/Z7biAeD8PAkqgmWhxG2A/FeatureServer/1/query?f=json&where=Confirmed+%3E+0&outFields=Country_Region%2CConfirmed%2CDeaths%2CRecovered%2CLast_Update%2CActive&orderByFields=Confirmed+desc";

export default class CovidTrackerLWC extends LightningElement {
        @track aggregateobj ={
        TotalConfirmed: 0,
        TotalActive:    0,
        TotalDeaths:    0,
        TotalRecovered: 0,
        TotalFatality:  0,
        TotalRecovery:  0
       }
    countrySelectedInCombo;
    @track countryList;
    @track showListView=true;
    @track selectedCountryListView;
    @track tabledata=[];
    @track filtertabledata=[];

    connectedCallback()
    {
        this.fetchData();
    }
    fetchData()
    {
        fetch(apiURL)
        .then(res => res.json())   //res.json() returns a promise which resolves to JS object
        .then(data => {
            //console.log(data.features);
            this.formatData(data.features);
        })
    }
    formatData(result){
        let mapcountryTocases={};
        result.forEach((data ,index)=> {           //each data is an object with property attributes and geometry
              let item = data.attributes;
              if(item.Country_Region in mapcountryTocases)  //Objects in JS eliminate the use of map
              {
                  mapcountryTocases[item.Country_Region].Confirmed += item.Confirmed;
                  mapcountryTocases[item.Country_Region].Active += item.Active;
                  mapcountryTocases[item.Country_Region].Deaths += item.Deaths;
                  mapcountryTocases[item.Country_Region].Recovered += item.Recovered;
                }
              else{
                  mapcountryTocases[item.Country_Region] = {
                      Confirmed: item.Confirmed,
                      Active: item.Active,
                      Deaths: item.Deaths,
                      Recovered: item.Recovered,
                      LastUpdate: item.Last_Update
                    }
              }
              this.aggregateobj.TotalConfirmed += item.Confirmed;
              this.aggregateobj.TotalDeaths += item.Deaths;
              this.aggregateobj.TotalActive += item.Active;
              this.aggregateobj.TotalRecovered += item.Recovered;
            })
            this.aggregateobj.TotalFatality = this.getFatalityRate().toFixed(2)+'%';
            this.aggregateobj.TotalRecovery = this.getRecoveryRate().toFixed(2)+'%';
            this.generateCountryList(mapcountryTocases);                                    //ComboBox DATA
            this.tabledata = this.prepareDataforTable(mapcountryTocases);                   //Table DATA
            this.filtertabledata = this.tabledata;
            //console.log(JSON.stringify(this.tabledata));                                  convert Object to String to print JS Objects in console
            //console.log('Country By Cases :'+JSON.stringify(mapcountryTocases.China))
            //console.log('Aggregate Data '+JSON.stringify(this.aggregateobj));
        
    }

    getRecoveryRate(item){
        if(item) {return ((item.Recovered / item.Confirmed)*100)}
          else{
              return ((this.aggregateobj.TotalRecovered / this.aggregateobj.TotalConfirmed)*100)
          }
    }

    getFatalityRate(item){
          if(item) {return ((item.Deaths / item.Confirmed)*100)}
          else{
              return ((this.aggregateobj.TotalDeaths / this.aggregateobj.TotalConfirmed)*100)
          }
    }

    generateCountryList(mapres){
        this.countryList = Object.keys(mapres).map(ele =>  {
            return {label: ele, value: ele }
        })
    }

    prepareDataforTable(mapres){
        console.log(mapres.China.Confirmed);
        return Object.keys(mapres).map((ele,index) => {
            return {
                Key:           "Unique_Region"+ele,
                CountryName:   ele,
                Confirmed:     mapres[ele].Confirmed,
                Active:        mapres[ele].Active,                     //mapres.ele.Confirmed will not work bcoz ele is variable
                Recovered:     mapres[ele].Recovered,
                Deaths:        mapres[ele].Deaths,
                FatalityRate:  this.getFatalityRate(mapres.ele),
                RecoveryRate:  this.getRecoveryRate(mapres.ele)
            }
        })
    }
    handleCountryChange(event)
    {} 
    countrychangeListHandler(event)
    {
        if(event.target.value){
            this.filtertabledata = this.tabledata.filter(obj => (obj.CountryName.toLowerCase()).includes((event.target.value).toLowerCase()))
        }
        else{
            this.filtertabledata = this.tabledata
        }
    }
    ViewHandler(event)
    {
        if(event.target.dataset.name == "LIST")
        {
            this.template.querySelector('.listBtn').classList.add('dynamicbuttoncss');
            this.template.querySelector('.chartBtn').classList.remove('dynamicbuttoncss')
        }
        else if(event.target.dataset.name == "CHART")
        {
            this.template.querySelector('.listBtn').classList.remove('dynamicbuttoncss');
            this.template.querySelector('.chartBtn').classList.add('dynamicbuttoncss')
        }
    }
}