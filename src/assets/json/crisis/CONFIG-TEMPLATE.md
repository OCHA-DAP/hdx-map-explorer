crisis.json
===========
This is the main file that lists all of the active crises.

In the active list, insert the name of the folder which has the config files for the crisis
```
{
  "active": [
    "lake-chad",
    "south-sudan"
  ]
}
```

lake-chad/config.json
=====================
Single crisis config file
```
{
  /* crisis id, same as folder name */
  "name": "lake-chad",                                          
  /* title that is shown when user selects the crisis in the MPX */
  "title": "Lake Chad Basin Crisis",                            
  /* description - not shown anywhere yet */
  "description": "Lake Chad Basin Crisis description",          
  /* number of datasets - shown on the landing page */
  "datasets" : 5,
  /* configure where the map should be centered before the user selects any layer */
  "mapCenter": {                                                
    "lat": 10,
    "long": 10,
    "zoom": 5
  },
  /* available layers list */
  "layers": [                                                   
    {
      /* name of layer, shown in layer select dropdown + in the legend list */
      "name": "Number of Displaced People",                     
      /* id, should be unique among layers in this list, used by urls/deeplinking */
      "id": "1",                                                
      /* layer category, used for grouping inside layer select dropdown */
      "type": "DISPLACEMENT",                                   
      /* layer config file url */
      "url": "assets/json/crisis/lake-chad/idps.json"           
    },
    {
      "name": "Estimated Total Population",
      "id": "2",
      "type": "DISPLACEMENT",
      "url": "assets/json/crisis/lake-chad/population.json"
    },

```

lake-chad/thumbnail.png
=======================
Crisis thumbnail, used on the landing page

lake-chad/boundaries.geojson
============================
Main boundaries file, use this name as a convention. If other boundary files will exist, then this will be the primary one.

lake-chad/idps.json
===================
Layer config file for layer "Number of Displaced People"

```
{
  "name": "Number of Displaced People",
  "description": "Displaced persons by admin level 1",
  "source":"",
  "sourceUrl": "https://data.hdx.rwlabs.org/dataset/2d3c4e22-4603-45b8-b231-82cc2d45abf2",
  "url": "https://data.hdx.rwlabs.org/dataset/2d3c4e22-4603-45b8-b231-82cc2d45abf2/resource/1aaa5281-de4f-4ffa-a5ef-37c754a86478/download/rowca_idp-ref_ffill_2.csv",
  "map": {
    "shapefile": {
      "url": "assets/json/crisis/lake-chad/boundaries.geojson",
      "joinColumn": "NAME_1"
    },
    "layers": [
      {
        "type":["choropleth","bubble"],
        "joinColumn": "#adm1+name",
        "valueColumn": "#affected+displaced",
        "threshold": [1000,10000,50000,100000,500000,1000000],
        "colors": ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a"],
        "operations": [
           {
            "type": "select",
            "options": {
              "column": "#affected+type",
              "operator": "=",
              "value": "idp"
            }
          },
          {
            "type": "select",
            "options": {
              "column": "#date+bin",
              "operator": "=",
              "value": "2016-06-30"
            }
          }
        ]
      }
    ]
  },
  "charts": [
    {
      "name": "Number of Displaced Over Time",
      "options": {
        "data": {
          "x": "#date+bin",
          "y": "#affected+displaced+sum",
          "type": "area"
        },
        "axis": {
          "x": {
            "type": "timeseries",
            "tick": {
              "format": "%B %Y",
              "rotate": 30
            },
            "height": 60
          }
        }
      },
      "operations": [
        {
          "type": "select",
          "options": {
            "column": "#affected+type",
            "operator": "=",
            "value": "idp"
          }
        },
        {
          "type": "sort",
          "options": {
            "columns": "#date+bin"
          }
        },
        {
          "type": "sum",
          "options": {
            "groupByColumn": "#date+bin",
            "statsColumn": "#affected+displaced"
          }
        }
      ]
    },
    {
      "name": "Number of Displaced By Type",
      "options": {
        "data": {
          "x": "#affected+type",
          "y": "#affected+displaced+sum",
          "type": "bar"
        },
        "axis": {
          "x": {
            "type": "category",
            "tick": {
              "rotate": 30
            },
            "height": 60
          }
        }
      },
      "operations": [
        {
          "type": "select",
          "options": {
            "column": "#date+bin",
            "operator": "=",
            "value": "2016-06-30"
          }
        },
        {
          "type": "sum",
          "options": {
            "groupByColumn": "#affected+type",
            "statsColumn": "#affected+displaced"
          }
        }
      ]
    }
  ]
}

```