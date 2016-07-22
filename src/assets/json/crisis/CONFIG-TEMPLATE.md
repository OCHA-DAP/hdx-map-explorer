crisis.json
===========
This is the main file that lists all of the active crises.

In the active list, insert the name of the folder which has the config files for the crisis
```javascript
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
```javascript
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
      /* name of layer, shown in layer select dropdown */
      "name": "Number of Displaced People",                     
      /* id, should be unique among layers in this list, used by urls/deeplinking */
      "id": "1",                                                
      /* layer category, used for grouping inside layer select dropdown */
      "type": "DISPLACEMENT",                                   
      /* layer config file url */
      "url": "assets/json/crisis/lake-chad/idps.json"           
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

```javascript
{
  /* name of layer, shown in legend */
  "name": "Number of Displaced People",
  /* internal description */
  "description": "Displaced persons by admin level 1",
  /* source dataset url - shown in the "Info" link in the legend's layer information */
  "sourceUrl": "https://data.hdx.rwlabs.org/dataset/2d3c4e22-4603-45b8-b231-82cc2d45abf2",
  /* data url - used to pull the data */
  "url": "https://data.hdx.rwlabs.org/dataset/2d3c4e22-4603-45b8-b231-82cc2d45abf2/resource/1aaa5281-de4f-4ffa-a5ef-37c754a86478/download/rowca_idp-ref_ffill_2.csv",
  
  /* map configuration */
  "map": {
    /* boundaries config */
    "shapefile": {
      /* layer's boundaries file, might be different from the primary boundaries file */
      "url": "assets/json/crisis/lake-chad/boundaries.geojson",
      /* column used to match a boundary to a dataset data point */
      "joinColumn": "NAME_1"
    },
    /* available layers in current file - currently only one layer is supported  */
    "layers": [
      {
        /* how should the layer be visualised: choropleth/bubble/point/chart-only; the first element is the default option */
        "type":["choropleth","bubble"],
        /* column used to join with the boundaries file */
        "joinColumn": "#adm1+name",
        /* column where the value is stored */
        "valueColumn": "#affected+displaced",
        /* threshold list - if none is supplied, system will automatically generate one by splitting the interval between the
         * min-value and the max-value as many steps as the available colors (see below the colors field)
         */
        "threshold": [1000,10000,50000,100000,500000,1000000],
        /* colors list - mandatory */
        "colors": ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a"],
        /* filtering operations list - HXL operations in order to prepare the data downloaded from the data url */
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
  /* available charts configuration - optional */
  "charts": [
    {
      /* chart title */
      "name": "Number of Displaced Over Time",
      /* options list
       * compatible with c3js API, see here: http://c3js.org/reference.html 
       */
      "options": {
        /* mandatory */
        "data": {
          /* column to place on x axis */
          "x": "#date+bin",
          /* column for y axis */
          "y": "#affected+displaced+sum",
          /* chart type: area/bar/line/etc - see c3js API */
          "type": "area"
        },
        /* axis config */
        "axis": {
          "x": {
            /* timeseries, when X axis contains dates */
            "type": "timeseries",
            "tick": {
              /* date format for X axis */
              "format": "%B %Y",
            }
          }
        }
      },
      /* filtering operations list - HXL operations in order to prepare the data downloaded from the data url */
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
```