import { React, DataSourceComponent, AllWidgetProps } from 'jimu-core';
import type { DataSource } from 'jimu-core';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Extent from "@arcgis/core/geometry/Extent.js";
import Graphic from '@arcgis/core/Graphic';
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Polygon from "@arcgis/core/geometry/Polygon";
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import './widgetStyles.css';
import "react-pdf/dist/esm/Page/TextLayer.css";
import { CSSProperties } from 'react';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import Geometry from "@arcgis/core/geometry/Geometry.js";
import Legend from "@arcgis/core/widgets/Legend.js";
import html2canvas from 'html2canvas';
import * as Logos from './logos';

const { useRef, useState, useEffect } = React;

// Set up the virtual file system for pdfMake.
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/**
 * Widget component that displays a PDF report generated from a feature layer.
 * @param {AllWidgetProps<unknown>} props - The widget properties.
 * @returns {JSX.Element} The rendered widget component.
 */
export default function Widget(props: AllWidgetProps<unknown>) {
    const dsRef = useRef(null);
    const mapViewRef = useRef(null);
    const [pdfBlob, setPdfBlob] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [neighborhoodList, setNeighborhoodList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [CSAList, setCSAList] = useState([]);
    const [censusTractList, setCensusTractList] = useState([]);
    const [cityCouncilDistrictsList, setCityCouncilDistrictsList] = useState([]);
    const [servicePlanningAreaList, setServicePlanningAreaList] = useState([]);
    const [supervisorDistrictList, setSupervisorDistrictList] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showPDFPane, setShowPDFPane] = useState(false);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [imageDimensions, setImageDimensions] = useState(null);
    const [pdfGenerationComplete, setPdfGenerationComplete] = useState(false);
    const [boundaryType, setBoundaryType] = useState<string | null>(null);
    const [selectedDatasets, setSelectedDatasets] = useState([]);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [loadingDots, setLoadingDots] = useState(1);
    const [mapScreenshotDataArray, setMapScreenshotDataArray] = useState([]);
    const progressCtrRef = React.useRef(0);
    const slideCtrRef = React.useRef(0);
    const [blobURL, setBlobURL] = useState(null);
    const [selectedRecordIndex, setSelectedRecordIndex] = React.useState("");
    const [farmersMarkets, setFarmersMarkets] = useState<FeatureLayer | null>(null);
    const [calFreshFoodRetailer, setCalFreshFoodRetailer] = useState<FeatureLayer | null>(null);
    const [calFreshRestaurant, setCalFreshRestaurant] = useState<FeatureLayer | null>(null);
    const [communityGardens, setCommunityGardens] = useState<FeatureLayer | null>(null);
    const [foodPantry, setFoodPantry] = useState<FeatureLayer | null>(null);
    const [parks, setParks] = useState<FeatureLayer | null>(null);
    const [parksAndGardens, setParksAndGardens] = useState<FeatureLayer | null>(null);
    const [poverty, setPoverty] = useState<FeatureLayer | null>(null); // NEW
    const [publicElementarySchools, setPublicElementarySchools] = useState<FeatureLayer | null>(null);
    const [publicHighSchools, setPublicHighSchools] = useState<FeatureLayer | null>(null);
    const [publicMiddleSchools, setPublicMiddleSchools] = useState<FeatureLayer | null>(null);
    const [restaurants, setRestaurants] = useState<FeatureLayer | null>(null);
    const [retailFoodMarkets, setRetailFoodMarkets] = useState<FeatureLayer | null>(null);
    const [wicFoodRetailer, setWicFoodRetailer] = useState<FeatureLayer | null>(null);
    const [calFreshCases, setCalFreshCases] = useState<FeatureLayer | null>(null);
    const [calFreshGap, setCalFreshGap] = useState<FeatureLayer | null>(null);
    const [groceryStoresSupermarkets, setGroceryStoresSupermarkets] = useState<FeatureLayer | null>(null);
    const [foodInsecurity, setFoodInsecurity] = useState<FeatureLayer | null>(null);
    const [obesity, setObesity] = useState<FeatureLayer | null>(null);
    const [diabetes, setDiabetes] = useState<FeatureLayer | null>(null);
    const [heartDisease, setHeartDisease] = useState<FeatureLayer | null>(null);
    const [depression, setDepression] = useState<FeatureLayer | null>(null);
    const [income, setIncome] = useState<FeatureLayer | null>(null);
    const [hispanic, setHispanic] = useState<FeatureLayer | null>(null);
    const [englishSecondLanguage, setEnglishSecondLanguage] = useState<FeatureLayer | null>(null);
    const [immigrationStatus, setImmigrationStatus] = useState<FeatureLayer | null>(null);
    const [vehicleOwnershipLandowners, setVehicleOwnershipLandowners] = useState<FeatureLayer | null>(null);
    const [vehicleOwnershipRenters, setVehicleOwnershipRenters] = useState<FeatureLayer | null>(null);
    const [householdSize, setHouseholdSize] = useState<FeatureLayer | null>(null);
    const [disability, setDisability] = useState<FeatureLayer | null>(null);
    const [healthInsurance, setHealthInsurance] = useState<FeatureLayer | null>(null);
    const [healthyPlacesIndex, setHealthyPlacesIndex] = useState<FeatureLayer | null>(null);
    const [socialVulnerabilityIndex, setSocialVulnerabilityIndex] = useState<FeatureLayer | null>(null);
    const [redlining, setRedlining] = useState<FeatureLayer | null>(null);

    const pointsInsideFeatureCountRef = React.useRef(null);

    const mapStyle: CSSProperties = {
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: '669.12px',
        height: '500px',
        backgroundColor: 'white',
        border: '0px solid black',
        visibility: 'hidden',
    };

    const reportButtonStyle: CSSProperties = {
        position: 'absolute',
        top: '131px',
        left: '15px',
        zIndex: 2000,
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px 0px',
        pointerEvents: 'auto'
    };

    const reportFormStyle: CSSProperties = {
        width: 'calc(100% - 300px)', // reducing width by 40px for a 20px margin on each side
        margin: '0 150px',
        marginTop: '20px',
        height: 'auto)',
        overflow: 'auto',
        visibility: 'hidden',
        backgroundColor: 'white',
        border: '1px solid black',
        padding: '20px', // added padding inside for spacing
        boxSizing: 'border-box', // to ensure padding and border are included in the width
        pointerEvents: 'auto',
        position: 'relative'
    };

    const dropdownStyle: CSSProperties = {
        width: '100%', // dropdown takes the full width of the parent
        padding: '8px', // added padding for better appearance
        marginBottom: '20px', // space between dropdowns and their labels
        border: '1px solid #ccc', // grayish border for dropdown
        borderRadius: '4px', // slightly rounded corners
        fontSize: '16px', // size of the font in the dropdown
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // subtle shadow for depth
        pointerEvents: 'auto'
    };

    useEffect(() => {
        const LACountyWebMap = new WebMap({
            portalItem: {
                id: '2bc29891fc744b62b57de017897583e0'
            }
        });

        LACountyWebMap.load().then(() => {

            const schools = LACountyWebMap.layers.getItemAt(1) as GroupLayer;
            const greenAndGardenSpaces = LACountyWebMap.layers.getItemAt(2) as GroupLayer;
            const demographics = LACountyWebMap.layers.getItemAt(4) as GroupLayer; // NEW
            const retailFoodOutlets = LACountyWebMap.layers.getItemAt(6) as GroupLayer;
            const foodAssistanceAndBenefits = LACountyWebMap.layers.getItemAt(7) as GroupLayer;
            const retailFoodMarkets_GroupLayer = retailFoodOutlets.layers.getItemAt(2) as GroupLayer;
            const residentHealth_GroupLayer = LACountyWebMap.layers.getItemAt(5) as GroupLayer;
            const restaurants_GroupLayer = retailFoodOutlets.layers.getItemAt(3) as GroupLayer;
            const neightborhoodCharacteristics_GroupLayer = LACountyWebMap.layers.getItemAt(3) as GroupLayer;
            const farmersMarkets_loading = retailFoodOutlets.layers.getItemAt(0) as FeatureLayer;
            const calFreshFoodRetailer_loading = foodAssistanceAndBenefits.layers.getItemAt(3) as FeatureLayer;
            const calFreshRestaurant_loading = foodAssistanceAndBenefits.layers.getItemAt(2) as FeatureLayer;
            const communityGardens_loading = greenAndGardenSpaces.layers.getItemAt(2) as FeatureLayer;
            const foodPantry_loading = foodAssistanceAndBenefits.layers.getItemAt(0) as FeatureLayer;
            const parks_loading = greenAndGardenSpaces.layers.getItemAt(1) as FeatureLayer;
            const parksAndGardens_loading = greenAndGardenSpaces.layers.getItemAt(0) as FeatureLayer;
            const poverty = demographics.layers.getItemAt(8) as GroupLayer; // NEW
            const poverty_loading = poverty.layers.getItemAt(5) as FeatureLayer;
            const publicElementarySchools_loading = schools.layers.getItemAt(2) as FeatureLayer;
            const publicHighSchools_loading = schools.layers.getItemAt(0) as FeatureLayer;
            const publicMiddleSchools_loading = schools.layers.getItemAt(1) as FeatureLayer;
            const restaurants_loading = restaurants_GroupLayer.layers.getItemAt(2) as FeatureLayer;
            const retailFoodMarkets_loading = retailFoodMarkets_GroupLayer.layers.getItemAt(2) as FeatureLayer;
            const wicFoodRetailer_loading = foodAssistanceAndBenefits.layers.getItemAt(1) as FeatureLayer;
            const calFreshCases_loading = foodAssistanceAndBenefits.layers.getItemAt(5) as FeatureLayer;
            const calFreshGap_loading = foodAssistanceAndBenefits.layers.getItemAt(4) as FeatureLayer;
            const groceryStoresSupermarkets_loading = retailFoodOutlets.layers.getItemAt(1) as FeatureLayer;
            const foodInsecurity_loading = residentHealth_GroupLayer.layers.getItemAt(4) as FeatureLayer;
            const obesity_loading = residentHealth_GroupLayer.layers.getItemAt(3) as FeatureLayer;
            const diabetes_loading = residentHealth_GroupLayer.layers.getItemAt(2) as FeatureLayer;
            const heartDisease_loading = residentHealth_GroupLayer.layers.getItemAt(1) as FeatureLayer;
            const depression_loading = residentHealth_GroupLayer.layers.getItemAt(0) as FeatureLayer;
            const income_group_loading = demographics.layers.getItemAt(9) as GroupLayer;
            const income_loading = income_group_loading.layers.getItemAt(5) as FeatureLayer;
            const hispanic_group_loading = demographics.layers.getItemAt(7) as GroupLayer;
            const hispanic_loading = hispanic_group_loading.layers.getItemAt(5) as FeatureLayer;
            const englishSecondLanguage_loading = demographics.layers.getItemAt(6) as FeatureLayer;
            const immigrationStatus_loading = demographics.layers.getItemAt(5) as FeatureLayer;
            const vehicleOwnershipRenters_loading = demographics.layers.getItemAt(3) as FeatureLayer;
            const vehicleOwnershipLandowners_loading = demographics.layers.getItemAt(4) as FeatureLayer;
            const householdSize_loading = demographics.layers.getItemAt(2) as FeatureLayer;
            const disability_loading = demographics.layers.getItemAt(1) as FeatureLayer;
            const healthInsurance_loading = demographics.layers.getItemAt(0) as FeatureLayer;
            const healthyPlacesIndex_loading = neightborhoodCharacteristics_GroupLayer.layers.getItemAt(2) as FeatureLayer;
            const socialVulnerabilityIndex_loading = neightborhoodCharacteristics_GroupLayer.layers.getItemAt(1) as FeatureLayer;
            const redlining_loading = neightborhoodCharacteristics_GroupLayer.layers.getItemAt(0) as FeatureLayer;

            // Ensure the layer is fully loaded before using it
            farmersMarkets_loading.load().then(() => {
                setFarmersMarkets(farmersMarkets_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            calFreshFoodRetailer_loading.load().then(() => {
                setCalFreshFoodRetailer(calFreshFoodRetailer_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            calFreshRestaurant_loading.load().then(() => {
                setCalFreshRestaurant(calFreshRestaurant_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            communityGardens_loading.load().then(() => {
                setCommunityGardens(communityGardens_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            foodPantry_loading.load().then(() => {
                setFoodPantry(foodPantry_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            parks_loading.load().then(() => {
                setParks(parks_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            parksAndGardens_loading.load().then(() => {
                setParksAndGardens(parksAndGardens_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            poverty_loading.load().then(() => {
                setPoverty(poverty_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            publicElementarySchools_loading.load().then(() => {
                setPublicElementarySchools(publicElementarySchools_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            publicHighSchools_loading.load().then(() => {
                setPublicHighSchools(publicHighSchools_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            publicMiddleSchools_loading.load().then(() => {
                setPublicMiddleSchools(publicMiddleSchools_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            restaurants_loading.load().then(() => {
                // Set the definition expression after the layer is loaded
                restaurants_loading.definitionExpression = "PE_DESCRIPTION LIKE '%RESTAURANT%'";

                setRestaurants(restaurants_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            retailFoodMarkets_loading.load().then(() => {
                // Set the definition expression after the layer is loaded
                retailFoodMarkets_loading.definitionExpression = "PE_DESCRIPTION LIKE '%FOOD MKT RETAIL%'";

                setRetailFoodMarkets(retailFoodMarkets_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            wicFoodRetailer_loading.load().then(() => {
                setWicFoodRetailer(wicFoodRetailer_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

            calFreshCases_loading.load().then(() => {
                setCalFreshCases(calFreshCases_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            calFreshGap_loading.load().then(() => {
                setCalFreshGap(calFreshGap_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            groceryStoresSupermarkets_loading.load().then(() => {
                setGroceryStoresSupermarkets(groceryStoresSupermarkets_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            foodInsecurity_loading.load().then(() => {
                setFoodInsecurity(foodInsecurity_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            obesity_loading.load().then(() => {
                setObesity(obesity_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            diabetes_loading.load().then(() => {
                setDiabetes(diabetes_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            heartDisease_loading.load().then(() => {
                setHeartDisease(heartDisease_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            depression_loading.load().then(() => {
                setDepression(depression_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            income_loading.load().then(() => {
                setIncome(income_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            hispanic_loading.load().then(() => {
                setHispanic(hispanic_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            englishSecondLanguage_loading.load().then(() => {
                setEnglishSecondLanguage(englishSecondLanguage_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            immigrationStatus_loading.load().then(() => {
                setImmigrationStatus(immigrationStatus_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            vehicleOwnershipRenters_loading.load().then(() => {
                setVehicleOwnershipRenters(vehicleOwnershipRenters_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            vehicleOwnershipLandowners_loading.load().then(() => {
                setVehicleOwnershipLandowners(vehicleOwnershipLandowners_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            householdSize_loading.load().then(() => {
                setHouseholdSize(householdSize_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            disability_loading.load().then(() => {
                setDisability(disability_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            healthInsurance_loading.load().then(() => {
                setHealthInsurance(healthInsurance_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            healthyPlacesIndex_loading.load().then(() => {
                setHealthyPlacesIndex(healthyPlacesIndex_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            socialVulnerabilityIndex_loading.load().then(() => {
                setSocialVulnerabilityIndex(socialVulnerabilityIndex_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });
            redlining_loading.load().then(() => {
                setRedlining(redlining_loading);
            }).catch(error => {
                console.error("Error loading layer: ", error);
            });

        }).catch(error => {
            console.error("Error loading WebMap: ", error);
        });
    }, []);

    const datasets = [
        { id: 1, name: "CalFresh Cases", dataSource: calFreshCases },
        { id: 2, name: "CalFresh Food Retailers", dataSource: calFreshFoodRetailer },
        { id: 3, name: "CalFresh Gap", dataSource: calFreshGap },
        { id: 4, name: "CalFresh Restaurants", dataSource: calFreshRestaurant },
        { id: 5, name: "Community Gardens", dataSource: communityGardens },
        { id: 6, name: "Depression", dataSource: depression },
        { id: 7, name: "Diabetes", dataSource: diabetes },
        { id: 8, name: "Disability", dataSource: disability },
        { id: 9, name: "English Second Language", dataSource: englishSecondLanguage },
        { id: 10, name: "Farmer's Markets", dataSource: farmersMarkets },
        { id: 11, name: "Food Insecurity", dataSource: foodInsecurity },
        { id: 12, name: "Food Pantries", dataSource: foodPantry },
        { id: 13, name: "Grocery Stores/Supermarkets", dataSource: groceryStoresSupermarkets },
        { id: 14, name: "Health Insurance", dataSource: healthInsurance },
        { id: 15, name: "Healthy Places Index", dataSource: healthyPlacesIndex },
        { id: 16, name: "Heart Disease", dataSource: heartDisease },
        { id: 17, name: "Hispanic or Latino", dataSource: hispanic },
        { id: 18, name: "Household Size", dataSource: householdSize },
        { id: 19, name: "Immigration Status", dataSource: immigrationStatus },
        { id: 20, name: "Income", dataSource: income },
        { id: 21, name: "Obesity", dataSource: obesity },
        { id: 22, name: "Parks", dataSource: parks },
        { id: 23, name: "Parks and Gardens", dataSource: parksAndGardens },
        { id: 24, name: "Poverty", dataSource: poverty }, // NEW
        { id: 25, name: "Public Elementary Schools", dataSource: publicElementarySchools },
        { id: 26, name: "Public High Schools", dataSource: publicHighSchools },
        { id: 27, name: "Public Middle Schools", dataSource: publicMiddleSchools },
        { id: 28, name: "Redlining", dataSource: redlining },
        { id: 29, name: "Restaurants", dataSource: restaurants },
        { id: 30, name: "Retail Food Markets", dataSource: retailFoodMarkets },
        { id: 31, name: "Social Vulnerability Index", dataSource: socialVulnerabilityIndex },
        { id: 32, name: "Vehicle Ownership (Landowners)", dataSource: vehicleOwnershipLandowners },
        { id: 33, name: "Vehicle Ownership (Renters)", dataSource: vehicleOwnershipRenters },
        { id: 34, name: "WIC Food Retailers", dataSource: wicFoodRetailer },
    ];

    function getDatasetName(datasetId) {
        const dataset = datasets.find(ds => ds.id === datasetId);
        return dataset ? dataset.name : 'Unknown Dataset';
    }

    const [neighborhoods] = useState(new FeatureLayer({
        portalItem: {
            id: 'd6c55385a0e749519f238b77135eafac'
        }
    }));

    const [cities] = useState(new FeatureLayer({
        url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/19'
    }));

    const [CSA] = useState(new FeatureLayer({
        url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/23'
    }));

    const [censusTracts] = useState(new FeatureLayer({
        url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Demographics/MapServer/14'
    }));

    const [LACityCouncilDistricts] = useState(new FeatureLayer({
        url: 'https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13'
    }));

    const [servicePlanningAreas] = useState(new FeatureLayer({
        url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/23'
    }));

    const [supervisorDistricts] = useState(new FeatureLayer({
        url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/27'
    }));

    const ATTRIBUTE_MAP = {
        "Neighborhood": "name",
        "City": "CITY_NAME",
        "Countywide Statistical Area (CSA)": "LABEL",
        "Census Tract": "CT20",
        "LA City Council Districts": "NAME",
        "Service Planning Area (SPA)": "SPA_NAME",
        "Supervisor District": "LABEL",
    };

    React.useEffect(() => {
        if (isFetchingData) {
            const interval = setInterval(() => {
                setLoadingDots(prev => (prev === 7 ? 1 : prev + 1));
            }, 100);

            return () => clearInterval(interval);
        }
    }, [isFetchingData]);

    React.useEffect(() => {

        const sortByAttribute = (features, attribute) => {
            return features.sort((a, b) => a.attributes[attribute].localeCompare(b.attributes[attribute]));
        };

        if (boundaryType) {
            setIsFetchingData(true); // Start fetching when there's an actual boundary type
        }

        if (boundaryType === "Neighborhood") {
            neighborhoods.queryFeatures().then(featureSet => {
                setNeighborhoodList(sortByAttribute(featureSet.features, 'name'));
                setIsFetchingData(false);
            });
        } else if (boundaryType === "City") {
            cities.queryFeatures().then(featureSet => {
                setCityList(sortByAttribute(featureSet.features, 'CITY_NAME'));
                setIsFetchingData(false);
            });
        } else if (boundaryType === "Census Tract") {
            censusTracts.queryFeatures().then(featureSet => {
                setCensusTractList(sortByAttribute(featureSet.features, 'CT20'));
                setIsFetchingData(false);
            });
        } else if (boundaryType === "LA City Council Districts") {
            LACityCouncilDistricts.queryFeatures().then(featureSet => {
                setCityCouncilDistrictsList(sortByAttribute(featureSet.features, 'NAME'));
                setIsFetchingData(false);
            });
        } else if (boundaryType === "Service Planning Area (SPA)") {
            servicePlanningAreas.queryFeatures().then(featureSet => {
                setServicePlanningAreaList(sortByAttribute(featureSet.features, 'SPA_NAME'));
                setIsFetchingData(false);
            });
        } else if (boundaryType === "Supervisor District") {
            supervisorDistricts.queryFeatures().then(featureSet => {
                setSupervisorDistrictList(sortByAttribute(featureSet.features, 'LABEL'));
                setIsFetchingData(false);
            });
        }
        else if (boundaryType === "Countywide Statistical Area (CSA)") {
            CSA.queryFeatures().then(featureSet => {
                setCSAList(sortByAttribute(featureSet.features, 'LABEL'));
                setIsFetchingData(false);
            });
        }

    }, [boundaryType, neighborhoods, cities, censusTracts, LACityCouncilDistricts, servicePlanningAreas, supervisorDistricts, CSA]);

    /**
     * Handler for document load success event.
     * @param {Object} param - The event parameters.
     * @param {number} param.numPages - The total number of pages in the document.
     */

    interface ImageDimensions {
        width: number;
        height: number;
    }

    const handleCloseReport = () => {
        // Hide the report form
        const reportForm = document.getElementById("reportForm");
        if (reportForm) {
            reportForm.style.visibility = "hidden";
        }

        // Reset the form data
        setBoundaryType("");  // Reset boundary type
        setSelectedRecordIndex("");
        setSelectedDatasets([]);  // Reset selected datasets
    };

    const attributeKey = ATTRIBUTE_MAP[boundaryType];

    const featureName = selectedRecord?.attributes?.[attributeKey] || "Unknown Name";

    const generateTestPDF = async (imageDimensions) => {

        // Create a canvas for the basemap and polygon
        const canvas = document.createElement('canvas');
        const canvasWidth = 1920;
        const canvasHeight = 1080;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const mapWidth = imageDimensions.width;
        const mapHeight = imageDimensions.height;

        // Calculate the image's height based on the original width-to-height ratio, considering new width.
        const mapAspectRatio = mapHeight / mapWidth;
        /*         let 864 = (canvasWidth / 2) * .9;
                let imageHeight = 864 * mapAspectRatio; */

        console.log('Image dimensions:', 864, 647.3653281096964);

        /*         // Ensure the image fits within the canvas height
                if (imageHeight > canvasHeight) {
                    const scalingFactor = canvasHeight / imageHeight;
                    864 *= scalingFactor;
                    imageHeight *= scalingFactor;
                } */

        const selectedFeatureName = featureName;
        const averagePerSquareMile = "#";

        let statistics;

        let title_page;

        const bullet = '\u2022'; // Unicode bullet point

        title_page = [
            {
                stack: [
                    {
                        columns: [
                            {}, // Empty column for padding on the left side
                            {
                                text: `Food Availability in ${selectedFeatureName}`,
                                style: 'title_main',
                                width: canvasWidth * 0.75, // 75% of the canvas width
                                alignment: 'center'
                            },
                            {} // Empty column for padding on the right side
                        ],
                        // Add these if you want to balance out the space distributed to each column
                        columnGap: 0,
                        widths: ['12.5%', '75%', '12.5%']
                    },
                    {
                        text: `Generated on ${new Date().toLocaleDateString()}`, // This will display the current date
                        style: 'date_style',
                        margin: [0, 50]
                    }
                ],
                margin: [0, -150]
            },
            {
                columns: [
                    {
                        image: Logos.LACounty_logo,
                        height: 400,
                        width: 400,
                        absolutePosition: { x: 368, y: 610 }
                    },
                    {
                        image: Logos.USC_logo,
                        height: 240,
                        width: 584,
                        absolutePosition: { x: 1056, y: 708 }
                    }
                ]
            }
        ];

        const overlap = 10;  // Set the thickness of your outline

        function generateSlideForDataset(datasetId, datasetName) {

            const coloredLine = {
                canvas: [{
                    type: 'line',
                    x1: -10,
                    y1: 210,
                    x2: 720,
                    y2: 210,
                    lineWidth: 4,
                    lineColor: '#4472C4'
                }],
                margin: [0, 0, 0, 220]
            };


            console.log('Generating slide for dataset:', selectedFeatureName);
            console.log('Dataset name:', datasetName);

            let textGroup;

            if (selectedFeatureName === "Alhambra") {

                if (datasetName === "CalFresh Food Retailers") {

                    textGroup = {
                        stack: [
                            { text: `${bullet} 42 ${datasetName} in ${selectedFeatureName}`, style: 'bodyText' },
                            { text: `${bullet} 1 ${datasetName} for every 1,934 people`, style: 'bodyText' },
                            { text: `${bullet} 5.5 ${datasetName} every square mile`, style: 'bodyText' }
                        ],
                        margin: [0, -183, 0, 0]  // Adjust this margin to move the entire group up by 200 units
                    };

                } else if (datasetName === "Retail Food Markets") {

                    textGroup = {
                        stack: [
                            { text: `${bullet} 82 ${datasetName} in ${selectedFeatureName}`, style: 'bodyText' },
                            { text: `${bullet} 1 ${datasetName} for every 990 people`, style: 'bodyText' },
                            { text: `${bullet} 10.75 ${datasetName} every square mile`, style: 'bodyText' }
                        ],
                        margin: [0, -183, 0, 0]  // Adjust this margin to move the entire group up by 200 units
                    };

                } else if (datasetName === "WIC Food Retailers") {

                    textGroup = {
                        stack: [
                            { text: `${bullet} 4 ${datasetName} in ${selectedFeatureName}`, style: 'bodyText' },
                            { text: `${bullet} 1 ${datasetName} for every 20,303 people`, style: 'bodyText' },
                            { text: `${bullet} .52 ${datasetName} every square mile`, style: 'bodyText' }
                        ],
                        margin: [0, -183, 0, 0]  // Adjust this margin to move the entire group up by 200 units
                    };

                }

            } else if (selectedFeatureName === "San Marino") {

                if (datasetName === "CalFresh Food Retailers") {

                    textGroup = {
                        stack: [
                            { text: `${bullet} 0 ${datasetName} in ${selectedFeatureName}`, style: 'bodyText' }
                        ],
                        margin: [0, -183, 0, 0]  // Adjust this margin to move the entire group up by 200 units
                    };

                } else if (datasetName === "Retail Food Markets") {

                    textGroup = {
                        stack: [
                            { text: `${bullet} 1 ${datasetName} in ${selectedFeatureName}`, style: 'bodyText' },
                            { text: `${bullet} 1 ${datasetName} for every 12,254 people`, style: 'bodyText' },
                            { text: `${bullet} .27 ${datasetName} every square mile`, style: 'bodyText' }
                        ],
                        margin: [0, -183, 0, 0]  // Adjust this margin to move the entire group up by 200 units
                    };

                } else if (datasetName === "WIC Food Retailers") {

                    textGroup = {
                        stack: [
                            { text: `${bullet} 0 ${datasetName} in ${selectedFeatureName}`, style: 'bodyText' }
                        ],
                        margin: [0, -183, 0, 0]  // Adjust this margin to move the entire group up by 200 units
                    };

                }

            } else {

                textGroup = {
                    stack: [
                        { text: `${bullet} ${pointsInsideFeatureCountRef.current} ${datasetName} in ${selectedFeatureName}`, style: 'bodyText' },
                        { text: `${bullet} 1 ${datasetName} for every [#] people`, style: 'bodyText' },
                        { text: `${bullet} ${averagePerSquareMile} ${datasetName} every square mile`, style: 'bodyText' }
                    ],
                    margin: [0, -183, 0, 0]  // Adjust this margin to move the entire group up by 200 units
                };

            }

            const headerWithRectangles = {
                stack: [
                    {
                        canvas: [
                            {
                                type: 'rect',
                                x: -82,
                                y: 225,  // Starting position
                                w: 30,
                                h: 120,
                                color: '#FFCC00'
                            },
                            {
                                type: 'rect',
                                x: -104,
                                y: 225,  // Adjust based on the desired space between the rectangles
                                w: 10,
                                h: 120,
                                color: '#FFCC00'
                            }
                        ]
                    },
                    { text: datasetName, style: 'header', margin: [65, -100, 0, -200], alignment: 'left' } // Adjust the margin as per your requirements for fine-tuning

                ],
                margin: [0, 0, 0, 20]
            };
            // Define statistics inside the function to ensure it's unique for each slide
            const statistics = [
                headerWithRectangles,
                coloredLine,
                textGroup,
                {
                    columns: [
                        {
                            image: Logos.LACounty_logo,
                            height: 250,
                            width: 250,
                            absolutePosition: { x: 20, y: 810 }
                        },
                        {
                            image: Logos.USC_logo,
                            height: 150,
                            width: 365,
                            absolutePosition: { x: 270, y: 928 }
                        },
                        // Adding text next to the USC logo
                        {
                            // Assuming you want the text to be vertically aligned with the USC logo,
                            // adjust `y` to match and `x` to position to the right of the logo
                            text: 'Legend',
                            fontSize: 48, // Adjust font size as needed
                            bold: true,
                            absolutePosition: { x: 920, y: 878 }, // Adjust x to position right of the USC logo
                            // If more styling is needed, use a stack or additional properties
                        }
                    ]
                }
            ];

            return {
                table: {
                    widths: ['50%', '60%'],
                    heights: [canvasHeight],
                    body: [
                        [
                            {
                                stack: statistics,
                                margin: [65, 0] // 220
                            },
                            ''
                        ]
                    ]
                },
                layout: 'noBorders'
            };
        }


        let dynamicSlides = [];

        for (let datasetId of selectedDatasets) {
            const datasetName = getDatasetName(datasetId);
            dynamicSlides.push(generateSlideForDataset(datasetId, datasetName));
        }


        const docDefinition = {
            // Background definition for the red rectangle and black outline
            background: function (currentPage, pageSize) {
                if (currentPage === 1) {
                    // Return the rectangles for the first slide's background
                    return {
                        canvas: [
                            // Outer rectangle with color #990000
                            {
                                type: 'rect',
                                x: (canvasWidth - (canvasWidth - 80)) / 2,
                                y: (canvasHeight - (canvasHeight - 80)) / 2,
                                w: canvasWidth - 80,
                                h: canvasHeight - 80,
                                lineWidth: 5,
                                lineColor: '#990000'
                            },
                            // Inner rectangle with color #FFCC00
                            {
                                type: 'rect',
                                x: (canvasWidth - (canvasWidth - 90)) / 2,
                                y: (canvasHeight - (canvasHeight - 90)) / 2,
                                w: canvasWidth - 90,
                                h: canvasHeight - 90,
                                lineWidth: 5,
                                lineColor: '#FFCC00'
                            }
                        ]
                    };
                } else if (currentPage > 1) {
                    return {
                        canvas: [
                            // Red rectangle
                            {
                                type: 'rect',
                                x: pageSize.width - 200,
                                y: 0,
                                w: 200,
                                h: pageSize.height,
                                color: '#990000'
                            },
                            // White border around the map
                            {
                                type: 'rect',
                                x: pageSize.width - 864 - 2 * overlap - 160,
                                y: ((canvasHeight - 647.3653281096964) / 2) - overlap - 40,
                                w: 864 - 2 + 100,
                                h: 647.3653281096964 - 2 + 100,
                                color: 'white',
                                lineWidth: overlap - 8,
                                lineColor: 'white'
                            },
                            // Black border around the map
                            {
                                type: 'rect',
                                x: pageSize.width - 864 - 2 * overlap - 110,
                                y: ((canvasHeight - 647.3653281096964) / 2) - overlap + 10,
                                w: 864 - 1,
                                h: 647.3653281096964,
                                lineWidth: overlap,
                                lineColor: 'black'
                            }
                        ]
                    };
                }
                return null;
            },

            content: [
                // Content for the first slide
                {
                    stack: [
                        {
                            table: {
                                widths: ['100%'],
                                heights: [canvasHeight],
                                body: [
                                    [
                                        {
                                            stack: title_page,
                                            margin: [65, 320]
                                        }
                                    ]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ],
                },

                // Add the dynamic slides
                ...dynamicSlides.map((slide, index) => {
                    return {
                        stack: [
                            slide,
                            {
                                image: mapScreenshotDataArray[index],
                                width: 864,
                                height: 647.3653281096964,
                                absolutePosition: { x: 926, y: 216 } // 214
                            }
                        ]
                    }
                })

            ]
            ,

            pageSize: { width: canvasWidth, height: canvasHeight },
            pageOrientation: 'landscape',
            styles: {
                header: {
                    fontSize: 76,
                    color: 'black',
                    bold: true
                },
                bodyText: {
                    fontSize: 43,
                    color: 'black'
                },
                title_main: {
                    fontSize: 116,
                    color: 'black',
                    bold: true,
                    alignment: 'center'
                },
                date_style: {
                    fontSize: 43,
                    color: 'black',
                    alignment: 'center'
                }
            }
        };

        if (!selectedRecord || !selectedRecord || !selectedRecord.geometry) {
            console.error("Invalid record or geometry. Cannot generate PDF.");
            return;
        }

        pdfMake.createPdf(docDefinition).getBlob((blob) => {
            setPdfBlob(blob);
            setShowPDFPane(true);
        });
    };

    React.useEffect(() => {
        if (imageDimensions) {
            generateTestPDF(imageDimensions).then(() => {
                progressCtrRef.current += 1;
                if (progressCtrRef.current === slideCtrRef.current) {
                    setPdfGenerationComplete(true);
                    setIsLoadingReport(false);

                    handleCloseReport();
                }
            });
        }
    }, [imageDimensions]);

    // 1. Setup the map and layers for the selected feature
    const [webmap] = useState(new WebMap({ basemap: "topo-vector" }));

    const handleScreenshot = async () => {
        const mapView = mapViewRef.current;
        const screenshotArea = {
            x: 0,
            y: 0,
            width: mapView.width,
            height: mapView.height
        };

        console.log('Map view:', mapView.width, mapView.height);

        const screenshot = await mapView.takeScreenshot({ format: 'png', area: screenshotArea, width: mapView.width * 10, height: mapView.height * 10 });

        return screenshot.dataUrl;
    }

    let layerViews = {};

    const initializeMapView = async () => {
        if (mapViewRef.current) {

            if (selectedDatasets.includes(1)) {
                webmap.add(calFreshCases);
            }

            if (selectedDatasets.includes(2)) {
                webmap.add(calFreshFoodRetailer);
            }

            if (selectedDatasets.includes(3)) {
                webmap.add(calFreshGap);
            }

            if (selectedDatasets.includes(4)) {
                webmap.add(calFreshRestaurant);
            }

            if (selectedDatasets.includes(5)) {
                webmap.add(communityGardens);
            }

            if (selectedDatasets.includes(6)) {
                webmap.add(depression);
            }

            if (selectedDatasets.includes(7)) {
                webmap.add(diabetes);
            }

            if (selectedDatasets.includes(8)) {
                webmap.add(disability);
            }

            if (selectedDatasets.includes(9)) {
                webmap.add(englishSecondLanguage);
            }

            if (selectedDatasets.includes(10)) {
                webmap.add(farmersMarkets);
            }

            if (selectedDatasets.includes(11)) {
                webmap.add(foodInsecurity);
            }

            if (selectedDatasets.includes(12)) {
                webmap.add(foodPantry);
            }

            if (selectedDatasets.includes(13)) {
                webmap.add(groceryStoresSupermarkets);
            }

            if (selectedDatasets.includes(14)) {
                webmap.add(healthInsurance);
            }

            if (selectedDatasets.includes(15)) {
                webmap.add(healthyPlacesIndex);
            }

            if (selectedDatasets.includes(16)) {
                webmap.add(heartDisease);
            }

            if (selectedDatasets.includes(17)) {
                webmap.add(hispanic);
            }

            if (selectedDatasets.includes(18)) {
                webmap.add(householdSize);
            }

            if (selectedDatasets.includes(19)) {
                webmap.add(immigrationStatus);
            }

            if (selectedDatasets.includes(20)) {
                webmap.add(income);
            }

            if (selectedDatasets.includes(21)) {
                webmap.add(obesity);
            }

            if (selectedDatasets.includes(22)) {
                webmap.add(parks);
            }

            if (selectedDatasets.includes(23)) {
                webmap.add(parksAndGardens);
            }

            if (selectedDatasets.includes(24)) {
                webmap.add(poverty);
            }

            if (selectedDatasets.includes(25)) {
                webmap.add(publicElementarySchools);
            }

            if (selectedDatasets.includes(26)) {
                webmap.add(publicHighSchools);
            }

            if (selectedDatasets.includes(27)) {
                webmap.add(publicMiddleSchools);
            }

            if (selectedDatasets.includes(28)) {
                webmap.add(redlining);
            }

            if (selectedDatasets.includes(29)) {
                webmap.add(restaurants);
            }

            if (selectedDatasets.includes(30)) {
                webmap.add(retailFoodMarkets);
            }

            if (selectedDatasets.includes(31)) {
                webmap.add(socialVulnerabilityIndex);
            }

            if (selectedDatasets.includes(32)) {
                webmap.add(vehicleOwnershipLandowners);
            }

            if (selectedDatasets.includes(33)) {
                webmap.add(vehicleOwnershipRenters);
            }

            if (selectedDatasets.includes(34)) {
                webmap.add(wicFoodRetailer);
            }

            const mapView = new MapView({
                container: mapViewRef.current,
                map: webmap
            });

            mapViewRef.current = mapView;

            await mapView.when();

            for (const dataset of datasets) {
                if (selectedDatasets.includes(dataset.id) && dataset.dataSource) {
                    const lv = await mapView.whenLayerView(dataset.dataSource);
                    layerViews[dataset.id] = lv;
                }
            }

            // Wait for the mapView to finish updating after the zoom operation
            await new Promise<void>(resolve => {
                const handle = mapView.watch('updating', updating => {
                    if (!updating) {
                        handle.remove();
                        resolve();
                    }
                });
            });
        }
    }

    const getImageDimensions = (base64String: string): Promise<ImageDimensions> => {
        return new Promise((resolve, reject) => {
            const img: HTMLImageElement = new Image();

            img.onload = function (this: HTMLImageElement) {
                resolve({ width: this.width, height: this.height });
            };

            img.onerror = function () {
                reject(new Error("Failed to load image"));
            };

            img.src = base64String;
        });
    };

    /**
     * Handler for dropdown change event.
     * @param {Event} event - The event object.
     */
    const handleDropdownChange = (event) => {
        const selectedIndex = event.target.value;
        setSelectedRecordIndex(selectedIndex);

        let record;
        if (boundaryType === "Neighborhood") {
            record = neighborhoodList[selectedIndex];
        } else if (boundaryType === "City") {
            record = cityList[selectedIndex];
        } else if (boundaryType === "Census Tract") {
            record = censusTractList[selectedIndex];
        } else if (boundaryType === "LA City Council Districts") {
            record = cityCouncilDistrictsList[selectedIndex];
        } else if (boundaryType === "Service Planning Area (SPA)") {
            record = servicePlanningAreaList[selectedIndex];
        } else if (boundaryType === "Supervisor District") {
            record = supervisorDistrictList[selectedIndex];
        }
        else if (boundaryType === "Countywide Statistical Area (CSA)") {
            record = CSAList[selectedIndex];
        }

        if (record) {
            setSelectedRecord(record);
        }
    };

    const handleDatasetChange = (datasetId) => {
        if (selectedDatasets.includes(datasetId)) {
            setSelectedDatasets(prev => prev.filter(id => id !== datasetId));
        } else {
            setSelectedDatasets(prev => [...prev, datasetId]);
        }
    };

    const createMask = async (geometry) => {
        const mapView = mapViewRef.current;

        // Create an instance of the GraphicsLayer
        const maskLayer = new GraphicsLayer();

        mapView.map.add(maskLayer);

        // Create a large polygon that covers the whole map
        const bigPolygon = new Polygon({
            rings: [
                [
                    [-20037508.3427892, -20037508.3427892],
                    [-20037508.3427892, 20037508.3427892],
                    [20037508.3427892, 20037508.3427892],
                    [20037508.3427892, -20037508.3427892],
                    [-20037508.3427892, -20037508.3427892]
                ]
            ],
            spatialReference: mapView.spatialReference
        });

        // Subtract the feature's geometry from the big polygon to get the mask
        const mask = geometryEngine.difference(bigPolygon, geometry) as Polygon;

        const symbol = new SimpleFillSymbol({
            color: [0, 0, 0, 0],
            outline: {
                color: [0, 0, 0, 0],
                width: 0
            }
        });

        // Create a graphic for the mask
        const maskGraphic = new Graphic({
            geometry: mask,
            symbol: symbol
        });

        // Clear previous mask graphics and add the new mask to the GraphicsLayer
        maskLayer.graphics.removeAll();
        maskLayer.graphics.add(maskGraphic);
    };

    const filterPointsWithinPolygon = async (record, datasetId) => {
        console.log("Record:", record);
        // Ensure currentLayerView is defined before proceeding
        const currentLayerView = layerViews[datasetId];
        if (!currentLayerView) {
            console.error(`No layer view found for dataset ID: ${datasetId}`);
            return;
        }

        // Check the geometry type of the layer
        const geometryType = currentLayerView.layer.geometryType;

        if (geometryType === "polygon") {
            console.log("Clipping features within the polygon geometry.");
            const featureLayer = currentLayerView.layer;

            // Print the entire feature layer for debugging
            console.log("Feature layer: ", featureLayer);

            // Print the renderer object, which includes the symbology of the feature layer
            console.log("Feature layer renderer: ", featureLayer.renderer);

            // Retrieve the renderer from the feature layer
            const featureLayerRenderer = featureLayer.renderer;
            console.log(`Renderer type: ${featureLayerRenderer.type}`);

            const query = featureLayer.createQuery();
            query.geometry = record.geometry;
            query.spatialRelationship = "intersects";

            const defaultSymbol = {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                color: "lightgray", // any light color to ensure visibility on the map
                style: "solid",
                outline: {  // autocasts as new SimpleLineSymbol()
                    color: "darkgray",
                    width: 1
                }
            };

            try {
                const features = await featureLayer.queryFeatures(query);
                if (features.features.length > 0) {
                    console.log("Features returned from query:", features.features.length);

                    const intersectedFeatures = features.features.map(feature => {
                        if (feature.geometry) {
                            const intersectedGeometry = geometryEngine.intersect(feature.geometry, record.geometry) as Geometry;
                            if (intersectedGeometry) {
                                // For ClassBreaksRenderer, find the correct symbol based on the feature's attribute
                                let symbol;
                                if (featureLayerRenderer.type === "class-breaks") {
                                    const attributeValue = feature.attributes[featureLayerRenderer.field];
                                    for (let cb of featureLayerRenderer.classBreakInfos) {
                                        if (attributeValue >= cb.minValue && attributeValue < cb.maxValue) {
                                            symbol = cb.symbol.clone();
                                            break;
                                        }
                                    }
                                } else if (featureLayerRenderer.type === "unique-value") {
                                    // For UniqueValueRenderer, find the correct symbol based on the feature's attribute value
                                    const attributeValue = feature.attributes[featureLayerRenderer.field]; // Assuming a single field for simplicity
                                    for (let uv of featureLayerRenderer.uniqueValueInfos) {
                                        if (uv.value === attributeValue) {
                                            symbol = uv.symbol.clone();
                                            break;
                                        }
                                    }
                                }
                                // Ensure a symbol was found or fallback to a default symbol
                                symbol = symbol || defaultSymbol;

                                // Create the graphic with the symbol
                                return new Graphic({
                                    geometry: intersectedGeometry,
                                    attributes: feature.attributes,
                                    symbol: symbol // Apply the symbol directly
                                });
                            }
                        }
                    }).filter(feature => feature);

                    const graphicsLayer = new GraphicsLayer({
                        graphics: intersectedFeatures
                    });

                    console.log("Intersected features:", intersectedFeatures.length);
                    // After adding the intersected features to the map
                    mapViewRef.current.map.add(graphicsLayer);

                    // Create a Legend widget and add it to the mapView
                    const legend = new Legend({
                        view: mapViewRef.current, // Assuming mapViewRef.current is your mapView instance
                        layerInfos: [{
                            layer: graphicsLayer,
                            title: "Legend Title" // Customize your legend title
                        }]
                    });

                    // Place the legend in the bottom right of the map
                    mapViewRef.current.ui.add(legend, {
                        position: "bottom-right"
                    });

                    console.log("Intersected features added to the map and legend displayed.");


                    console.log("Intersected features added to the map.");

                    mapViewRef.current.map.layers.remove(featureLayer);
                    console.log("Original feature layer has been removed from the map.");
                } else {
                    console.log("No features returned from query.");
                }
            } catch (error) {
                console.error("Failed to query or intersect features:", error);
            }

        } else if (geometryType === "point") {
            console.log("Filtering points within the polygon geometry.");
            currentLayerView.filter = {
                geometry: record.geometry,
                spatialRelationship: "intersects"
            };
        } else {
            console.error("Unsupported geometry type for filtering or clipping.");
        }
    };

    const getPointsInsideFeature = async (datasetId) => {
        const currentLayerView = layerViews[datasetId];
        console.log("Dataset ID:", datasetId);
        if (!currentLayerView) {
            console.error(`No layer view found for dataset ID: ${datasetId}`);
            return Promise.reject(`No layer view found for dataset ID: ${datasetId}`);
        }

        try {
            console.log("Querying features for dataset ID:", datasetId);
            console.log("Current layer view:", currentLayerView);

            // Corrected: Define query parameters using the layer property of the currentLayerView
            const query = currentLayerView.layer.createQuery(); // This line is corrected
            query.geometry = currentLayerView.filter.geometry; // Assuming 'filter' exists and has a 'geometry' property
            query.spatialRelationship = "intersects";

            // Use the layer to perform the query
            const result = await currentLayerView.layer.queryFeatures(query); // This might also need correction based on context
            pointsInsideFeatureCountRef.current = result.features.length;
            return result.features.length;
        } catch (error) {
            console.error(`Error querying features for dataset ID: ${datasetId}`, error);
            return 0;
        }
    };


    function findLayerByDatasetId(datasetId) {
        const dataset = datasets.find(d => d.id === datasetId);
        if (dataset) {
            return webmap.layers.find(layer => layer === dataset.dataSource);
        }
        return null;
    }

    /**
     * Handle the click event to generate the PDF report.
     */
    const handleReportClick = async () => {

        const reportForm = document.getElementById("reportForm");
        if (reportForm) {
            reportForm.style.visibility = "hidden";
        }

        setMapScreenshotDataArray([]);
        // Initialize an empty array to store the screenshots
        const screenshots = [];

        setShowPDFPane(true);
        setPdfGenerationComplete(false);
        setIsLoadingReport(true);

        // Initialize the map view
        await initializeMapView();

        const mapView = mapViewRef.current;
        const record = selectedRecord;

        if (!record || !record.geometry) {
            console.error("Invalid record or geometry. Cannot generate report.");
            setIsLoadingReport(false);
            return;
        }

        // Zoom to the feature's extent
        const featureExtent = record.geometry.extent;
        const sr = record.geometry.spatialReference;

        // Ensure that the featureExtent is valid before proceeding
        if (featureExtent && featureExtent.xmin !== undefined && featureExtent.ymin !== undefined && featureExtent.xmax !== undefined && featureExtent.ymax !== undefined) {
            await mapView.when();

            mapView.graphics.removeAll();

            const extXY = new Extent({
                xmin: featureExtent.xmin,
                ymin: featureExtent.ymin,
                xmax: featureExtent.xmax,
                ymax: featureExtent.ymax,
                spatialReference: sr
            });

            const fillSymbol = new SimpleFillSymbol({
                color: [0, 0, 0, 0],  // This creates a fully transparent fill
                style: "solid",
                outline: {
                    color: [0, 0, 255], // Blue color for the outline
                    width: 2  // Adjust width as needed
                }
            });

            const graphic = new Graphic({
                geometry: record.geometry,
                symbol: fillSymbol
            });

            mapView.graphics.add(graphic);

            // Loop through each dataset, set it as visible, wait for the map to update, and take a screenshot
            for (let datasetId of selectedDatasets) {

                slideCtrRef.current = selectedDatasets.length;

                // Set all layers as invisible
                for (const layer of webmap.layers) {
                    layer.visible = false;
                }

                // Find the current layer using our custom function
                const currentLayer = findLayerByDatasetId(datasetId);
                if (currentLayer) {
                    currentLayer.visible = true;
                }

                mapView.goTo({ target: extXY })

                await new Promise<void>(resolve => {
                    const handle = mapView.watch('updating', updating => {
                        if (!updating) {
                            handle.remove();
                            resolve();
                        }
                    });
                });

                await createMask(record.geometry);

                await filterPointsWithinPolygon(record, datasetId);

                await getPointsInsideFeature(datasetId);

                await new Promise(resolve => setTimeout(resolve, 2000));

                const dataUrl = await handleScreenshot();

                // Push the screenshot data URL to the screenshots array
                screenshots.push(dataUrl);

                // Get the image dimensions
                try {
                    const dimensions = await getImageDimensions(dataUrl);
                    setImageDimensions(dimensions);
                } catch (error) {
                    console.error("Error getting image dimensions:", error);
                }
            }

            // Update the state with the collected screenshots
            setMapScreenshotDataArray(screenshots);

        } else {
            console.error("Invalid feature extent. Cannot generate report.");
            setIsLoadingReport(false);
        }
    };

    React.useEffect(() => {
        if (pdfBlob instanceof Blob) {
            const url = URL.createObjectURL(pdfBlob);
            setBlobURL(url);

            // Cleanup function to revoke the blob URL when it's not needed anymore
            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [pdfBlob]);

    const dataRender = (ds: DataSource) => {
        if (!ds) return null;

        dsRef.current = ds;

        const fName = props.useDataSources && props.useDataSources[0] && props.useDataSources[0].fields ? props.useDataSources[0].fields[0] : null;

        return (
            <>
                <div style={reportButtonStyle}>
                    <button
                        className="esri-widget--button border-0 select-tool-btn d-flex align-items-center justify-content-center"
                        onClick={() => {
                            const reportForm = document.getElementById("reportForm");
                            if (reportForm) {
                                if (reportForm.style.visibility === "hidden" || reportForm.style.visibility === "") {
                                    reportForm.style.visibility = "visible";
                                } else {
                                    reportForm.style.visibility = "hidden";
                                }
                            }
                        }}
                    >
                        <span className="esri-icon esri-icon-media2"></span>
                    </button>
                </div>

                <div style={mapStyle} ref={mapViewRef} id='reportMapView'>
                </div>
                <div className="record-list" id="reportForm" style={reportFormStyle}>

                    <button
                        className="close-report-button"
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', zIndex: 3000 }}
                        onClick={handleCloseReport}
                    >
                        ×
                    </button>

                    <label style={{ display: 'block', marginBottom: '10px', pointerEvents: 'auto' }}>Please select your boundary type:</label>
                    <select
                        value={boundaryType}  // This line will control the selected option based on the state.
                        onChange={(event) => setBoundaryType(event.target.value)}
                        style={dropdownStyle}
                    >
                        <option value="">Select a boundary type</option>
                        <option value="City">City</option>
                        <option value="Countywide Statistical Area (CSA)">Countywide Statistical Area (CSA)</option>
                        <option value="Census Tract">Census Tract</option>
                        <option value="LA City Council Districts">LA City Council Districts</option>
                        <option value="Neighborhood">Neighborhood</option>
                        <option value="Service Planning Area (SPA)">Service Planning Area (SPA)</option>
                        <option value="Supervisor District">Supervisor District</option>
                    </select>


                    <label style={{ display: 'block', marginTop: '20px', marginBottom: '10px' }}>Please choose your boundary:</label>
                    <select
                        value={selectedRecordIndex}
                        onChange={handleDropdownChange}
                        style={dropdownStyle}
                    >
                        <option value="" disabled selected>
                            {isFetchingData ? `Loading${'.'.repeat(loadingDots)}` : "Select a record"}
                        </option>

                        {boundaryType === "Neighborhood" && neighborhoodList.map((record, i) => (
                            <option key={i} value={i}>
                                {record.attributes['name'] || "Unnamed"}
                            </option>
                        ))}

                        {boundaryType === "City" && cityList.map((record, i) => (
                            <option key={i} value={i}>
                                {record.attributes['CITY_NAME'] || "Unnamed"}
                            </option>
                        ))}

                        {boundaryType === "Countywide Statistical Area (CSA)" && CSAList.map((record, i) => (
                            <option key={i} value={i}>
                                {record.attributes['LABEL'] || "Unnamed"}
                            </option>
                        ))}

                        {boundaryType === "Census Tract" && censusTractList.map((record, i) => (
                            <option key={i} value={i}>
                                {record.attributes['CT20'] || "Unnamed"}
                            </option>
                        ))}

                        {boundaryType === "LA City Council Districts" && cityCouncilDistrictsList.map((record, i) => (
                            <option key={i} value={i}>
                                {record.attributes['NAME'] || "Unnamed"}
                            </option>
                        ))}

                        {boundaryType === "Service Planning Area (SPA)" && servicePlanningAreaList.map((record, i) => (
                            <option key={i} value={i}>
                                {record.attributes['SPA_NAME'] || "Unnamed"}
                            </option>
                        ))}

                        {boundaryType === "Supervisor District" && supervisorDistrictList.map((record, i) => (
                            <option key={i} value={i}>
                                {record.attributes['LABEL'] || "Unnamed"}
                            </option>
                        ))}
                    </select>

                    <label style={{ display: 'block', marginTop: '20px', marginBottom: '10px' }}>
                        Please choose your datasets:
                    </label>

                    <div style={{ ...dropdownStyle, overflowY: 'auto', maxHeight: '150px', border: '1px solid #ccc', borderRadius: '4px', pointerEvents: 'auto' }}>
                        {datasets.map(dataset => (
                            <div key={dataset.id} style={{ padding: '8px', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedDatasets.includes(dataset.id)}
                                    onChange={() => handleDatasetChange(dataset.id)}
                                    style={{ marginRight: '8px', pointerEvents: 'auto' }}
                                />
                                {dataset.name}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', pointerEvents: 'auto' }}>
                        <button onClick={handleReportClick}>View Report</button>
                    </div>
                </div>

                {showPDFPane && (
                    <div className="pdf-pane" style={{
                        position: 'fixed',
                        top: '12.5%',
                        left: '25%',
                        width: '50%',
                        height: '75%',
                        zIndex: 5000,
                        backgroundColor: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px solid black',
                        pointerEvents: 'auto'
                    }}>
                        {isLoadingReport ? (
                            // Loading UI
                            <div className="loading-container" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                height: '100%'
                            }}>
                                <div className="spinner"></div>
                                <p>Loading Report...</p>
                            </div>
                        ) : (
                            // PDF Display
                            <>
                                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
                                    <button onClick={() => setShowPDFPane(false)} style={{ margin: '10px' }}>Close</button>
                                </div>
                                <div style={{ width: '100%', height: '100%', overflow: 'none', pointerEvents: 'auto' }}>
                                    <iframe src={blobURL} width="100%" height="100%" />

                                </div>
                            </>
                        )}
                    </div>
                )}

            </>
        );
    };

    const getQuery = () => {
        const w = '1=1';
        return {
            where: w,
            outFields: ['*'],
            returnGeometry: true,
            pageSize: 10
        };
    };

    React.useEffect(() => {
        return () => {
            if (mapViewRef.current) {
                mapViewRef.current.destroy();
            }
        };
    }, []);

    return (
        <div className="widget-use-feature-layer" style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
            <DataSourceComponent useDataSource={props.useDataSources[0]} query={getQuery()} widgetId={props.id} queryCount>
                {dataRender}
            </DataSourceComponent>
        </div>
    );
}

