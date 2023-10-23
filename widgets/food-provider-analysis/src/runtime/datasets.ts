import { React, DataSourceComponent, AllWidgetProps } from 'jimu-core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

const { useRef, useState } = React;

export const [farmersMarkets] = useState(new FeatureLayer({
    portalItem: {
        id: '306d4e5ec8294275982f3efb5a10916e'
    }
}));

export const [calFreshFoodRetailer] = useState(new FeatureLayer({
    url: 'https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services/Store_Locations/FeatureServer/0'
}));

export const [calFreshRestaurant] = useState(new FeatureLayer({
    url: 'https://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/Food_Data_CalFresh_Restaurant_Meals_Program/FeatureServer/0'
}));

export const [communityGardens] = useState(new FeatureLayer({
    url: 'https://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LACounty_CommunityGardens/FeatureServer/0'
}));

export const [ebtStoresAndMarkets] = useState(new FeatureLayer({
    url: 'https://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/EBTstore_market/FeatureServer/0'
}));

export const [foodPantry] = useState(new FeatureLayer({
    url: 'https://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/fap1/FeatureServer/0'
}));

export const [parks] = useState(new FeatureLayer({
    portalItem: {
        id: 'e87c08ca142c4d38b4de6cfeab6adcb4'
    }
}));

export const [parksAndGardens] = useState(new FeatureLayer({
    portalItem: {
        id: 'cac8597956bd4be69c08deb71d4bf31c'
    }
}));

export const [publicElementarySchools] = useState(new FeatureLayer({
    url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/49'
}));

export const [publicHighSchools] = useState(new FeatureLayer({
    url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/50'
}));

export const [publicMiddleSchools] = useState(new FeatureLayer({
    url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/51'
}));

export const [restaurants] = useState(new FeatureLayer({
    portalItem: {
        id: '14d0a2ba94a64be2b1b32c1d560f58cf'
    }
}));

export const [retailFoodMarkets] = useState(new FeatureLayer({
    portalItem: {
        id: '14d0a2ba94a64be2b1b32c1d560f58cf'
    }
}));

export const [supermarketsAndGroceryStores] = useState(new FeatureLayer({
    portalItem: {
        id: '3796521d25ec4089ae17904f365c0178'
    }
}));

export const [wicFoodRetailer] = useState(new FeatureLayer({
    portalItem: {
        id: '757431c30cb14e95884623655951d458'
    }
}));

export const datasets = [
    { id: 1, name: "CalFresh Food Retailer", dataSource: calFreshFoodRetailer },
    { id: 2, name: "CalFresh Restaurant", dataSource: calFreshRestaurant },
    { id: 3, name: "Community Gardens", dataSource: communityGardens },
    { id: 4, name: "EBT Stores and Markets", dataSource: ebtStoresAndMarkets },
    { id: 5, name: "Farmer's Markets", dataSource: farmersMarkets },
    { id: 6, name: "Food Pantry", dataSource: foodPantry },
    { id: 7, name: "Parks", dataSource: parks },
    { id: 8, name: "Parks and Gardens", dataSource: parksAndGardens },
    { id: 9, name: "Public Elementary Schools", dataSource: publicElementarySchools },
    { id: 10, name: "Public High Schools", dataSource: publicHighSchools },
    { id: 11, name: "Public Middle Schools", dataSource: publicMiddleSchools },
    { id: 12, name: "Restaurants", dataSource: restaurants },
    { id: 13, name: "Retail Food Markets", dataSource: retailFoodMarkets },
    { id: 14, name: "Supermarkets and Grocery Stores", dataSource: supermarketsAndGroceryStores },
    { id: 15, name: "WIC Food Retailer", dataSource: wicFoodRetailer },
];

export const [neighborhoods] = useState(new FeatureLayer({
    portalItem: {
        id: 'd6c55385a0e749519f238b77135eafac'
    }
}));

export const [cities] = useState(new FeatureLayer({
    url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/19'
}));

export const [CSA] = useState(new FeatureLayer({
    url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/23'
}));

export const [censusTracts] = useState(new FeatureLayer({
    url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Demographics/MapServer/14'
}));

export const [LACityCouncilDistricts] = useState(new FeatureLayer({
    url: 'https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13'
}));

export const [servicePlanningAreas] = useState(new FeatureLayer({
    url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/23'
}));

export const [supervisorDistricts] = useState(new FeatureLayer({
    url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/27'
}));