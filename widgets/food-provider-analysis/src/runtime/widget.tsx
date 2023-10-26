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

import * as Constants from './constants';
//import * as Datasets from './datasets';

const { useRef, useState } = React;

let layerView;

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
    const [mapScreenshotData, setMapScreenshotData] = useState(null);
    const [blobURL, setBlobURL] = useState(null);

    const mapStyle: CSSProperties = {
        position: 'absolute',
        top: '20%',
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        border: '1px solid black',
        visibility: 'hidden'
    };

    const reportButtonStyle: CSSProperties = {
        position: 'absolute',
        top: '15.7%',
        left: '1.5%',
        zIndex: 2000,
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px 0px',
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
    };

    const dropdownStyle: CSSProperties = {
        width: '100%', // dropdown takes the full width of the parent
        padding: '8px', // added padding for better appearance
        marginBottom: '20px', // space between dropdowns and their labels
        border: '1px solid #ccc', // grayish border for dropdown
        borderRadius: '4px', // slightly rounded corners
        fontSize: '16px', // size of the font in the dropdown
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // subtle shadow for depth
    };

    const [farmersMarkets] = useState(new FeatureLayer({
        portalItem: {
            id: '306d4e5ec8294275982f3efb5a10916e'
        }
    }));

    const [calFreshFoodRetailer] = useState(new FeatureLayer({
        url: 'https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services/Store_Locations/FeatureServer/0'
    }));

    const [calFreshRestaurant] = useState(new FeatureLayer({
        url: 'https://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/Food_Data_CalFresh_Restaurant_Meals_Program/FeatureServer/0'
    }));

    const [communityGardens] = useState(new FeatureLayer({
        url: 'https://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LACounty_CommunityGardens/FeatureServer/0'
    }));

    const [ebtStoresAndMarkets] = useState(new FeatureLayer({
        url: 'https://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/EBTstore_market/FeatureServer/0'
    }));

    const [foodPantry] = useState(new FeatureLayer({
        url: 'https://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/fap1/FeatureServer/0'
    }));

    const [parks] = useState(new FeatureLayer({
        portalItem: {
            id: 'e87c08ca142c4d38b4de6cfeab6adcb4'
        }
    }));

    const [parksAndGardens] = useState(new FeatureLayer({
        portalItem: {
            id: 'cac8597956bd4be69c08deb71d4bf31c'
        }
    }));

    const [publicElementarySchools] = useState(new FeatureLayer({
        url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/49'
    }));

    const [publicHighSchools] = useState(new FeatureLayer({
        url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/50'
    }));

    const [publicMiddleSchools] = useState(new FeatureLayer({
        url: 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/51'
    }));

    const [restaurants] = useState(new FeatureLayer({
        portalItem: {
            id: '14d0a2ba94a64be2b1b32c1d560f58cf'
        }
    }));

    const [retailFoodMarkets] = useState(new FeatureLayer({
        portalItem: {
            id: '14d0a2ba94a64be2b1b32c1d560f58cf'
        }
    }));

    const [supermarketsAndGroceryStores] = useState(new FeatureLayer({
        portalItem: {
            id: '3796521d25ec4089ae17904f365c0178'
        }
    }));

    const [wicFoodRetailer] = useState(new FeatureLayer({
        portalItem: {
            id: '757431c30cb14e95884623655951d458'
        }
    }));

    const datasets = [
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

    const attributeKey = ATTRIBUTE_MAP[boundaryType];

    const featureName = selectedRecord?.attributes?.[attributeKey] || "Unknown Name";

    const generateTestPDF = async (imageDimensions) => {

        let pointsInsideFeature;

        try {
            pointsInsideFeature = await getPointsInsideFeature();
        } catch (error) {
            console.error("Error getting points inside feature:", error);
            return; // Exit if there's an error
        }

        // Create a canvas for the basemap and polygon
        const canvas = document.createElement('canvas');
        const canvasWidth = 1920;
        const canvasHeight = 1080;
        canvas.width = canvasWidth;
        console.log("canvasWidth", canvas.width);
        canvas.height = canvasHeight;
        console.log("canvasHeight", canvas.height);
        const mapWidth = imageDimensions.width;
        console.log("mapWidth", mapWidth);
        const mapHeight = imageDimensions.height;
        console.log("mapHeight", mapHeight);

        // Calculate the image's height based on the original width-to-height ratio, considering new width.
        const mapAspectRatio = mapHeight / mapWidth;
        let imageWidth = (canvasWidth / 2) * .9;
        console.log("imageWidth", imageWidth);
        let imageHeight = imageWidth * mapAspectRatio;
        console.log("imageHeight", imageHeight);

        // Ensure the image fits within the canvas height
        if (imageHeight > canvasHeight) {
            const scalingFactor = canvasHeight / imageHeight;
            imageWidth *= scalingFactor;
            imageHeight *= scalingFactor;
        }

        const selectedFeatureName = featureName;
        const averagePerSquareMile = "#";

        let statistics;

        let title_page;

        const bullet = '\u2022'; // Unicode bullet point

        const coloredLine = {
            canvas: [{
                type: 'line',
                x1: -125,
                y1: 50,
                x2: 650,
                y2: 50,
                lineWidth: 4,
                lineColor: '#4472C4'
            }],
            margin: [0, 0, 0, 220]
        };

        const headerWithRectangles = {
            stack: [
                {
                    canvas: [
                        {
                            type: 'rect',
                            x: -182,
                            y: 250,  // Starting position
                            w: 30,
                            h: 120,
                            color: '#FFCC00'
                        },
                        {
                            type: 'rect',
                            x: -209,
                            y: 250,  // Adjust based on the desired space between the rectangles
                            w: 10,
                            h: 120,
                            color: '#FFCC00'
                        }
                    ]
                },
                { text: "Farmer's Markets", style: 'header', margin: [65, -60, 0, -200], alignment: 'left' } // Adjust the margin as per your requirements for fine-tuning

            ],
            margin: [0, 0, 0, 20]
        };

        statistics = [
            headerWithRectangles,
            coloredLine,
            { text: `${bullet} ${pointsInsideFeature} farmer’s market in ${selectedFeatureName}`, style: 'bodyText' },
            { text: `${bullet} 1 farmer’s market for every [#] people`, style: 'bodyText' },
            { text: `${bullet} ${averagePerSquareMile} farmer’s markets every square mile`, style: 'bodyText' },
            {
                columns: [
                    {
                        image: Constants.LACounty_logo,
                        height: 250,
                        width: 250,
                        absolutePosition: { x: 20, y: 810 }
                    },
                    {
                        image: Constants.USC_logo,
                        height: 150,
                        width: 365,
                        absolutePosition: { x: 270, y: 928 }
                    }
                ]
            }
        ];

        console.log("statistics", statistics);

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
                        margin: [0, 0]
                    }
                ],
                margin: [0, -150]
            },
            {
                columns: [
                    {
                        image: Constants.LACounty_logo,
                        height: 400,
                        width: 400,
                        absolutePosition: { x: 368, y: 610 }
                    },
                    {
                        image: Constants.USC_logo,
                        height: 240,
                        width: 584,
                        absolutePosition: { x: 1056, y: 708 }
                    }
                ]
            }
        ];

        console.log("title_page", title_page);

        const overlap = 10;  // Set the thickness of your outline

        function generateSlideForDataset(datasetId) {
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

        console.log("generateSlideForDataset", generateSlideForDataset);

        let dynamicSlides = [];

        for (let datasetId of selectedDatasets) {
            console.log("datasetId", datasetId);
            console.log("Statistics", statistics);
            dynamicSlides.push(generateSlideForDataset(datasetId));
            console.log("dynamicSlides", dynamicSlides);
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
                                x: pageSize.width - imageWidth - 2 * overlap - 160,
                                y: ((canvasHeight - imageHeight) / 2) - overlap - 40,
                                w: imageWidth - 2 + 100,
                                h: imageHeight - 2 + 100,
                                color: 'white',
                                lineWidth: overlap - 8,
                                lineColor: 'white'
                            },
                            // Black border around the map
                            {
                                type: 'rect',
                                x: pageSize.width - imageWidth - 2 * overlap - 110,
                                y: ((canvasHeight - imageHeight) / 2) - overlap + 10,
                                w: imageWidth - 1,
                                h: imageHeight,
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
                    pageBreak: 'after'
                },

                // Add the dynamic slides
                ...dynamicSlides.map((slide, index) => {
                    return {
                        stack: [
                            slide,
                            {
                                image: mapScreenshotData,
                                width: imageWidth,
                                height: imageHeight,
                                absolutePosition: { x: 926, y: 188 } // 187
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
                setPdfGenerationComplete(true);
                setIsLoadingReport(false);
            });
        }
    }, [imageDimensions]);

    // 1. Setup the map and layers for the selected feature
    const [webmap] = useState(new WebMap({ basemap: "topo-vector" }));

    async function handleScreenshot() {
        const mapView = mapViewRef.current;
        const screenshotArea = {
            x: 0,
            y: 0,
            width: mapView.width,
            height: mapView.height
        };

        const screenshot = await mapView.takeScreenshot({ format: 'png', area: screenshotArea, width: mapView.width * 10, height: mapView.height * 10 });

        return screenshot.dataUrl;
    }

    const initializeMapView = async () => {
        if (mapViewRef.current) {

            if (selectedDatasets.includes(1)) {
                webmap.add(calFreshFoodRetailer);
            }
            if (selectedDatasets.includes(2)) {
                webmap.add(calFreshRestaurant);
            }
            if (selectedDatasets.includes(3)) {
                webmap.add(communityGardens);
            }
            if (selectedDatasets.includes(4)) {
                webmap.add(ebtStoresAndMarkets);
            }
            if (selectedDatasets.includes(5)) {
                webmap.add(farmersMarkets);
            }
            if (selectedDatasets.includes(6)) {
                webmap.add(foodPantry);
            }
            if (selectedDatasets.includes(7)) {
                webmap.add(parks);
            }
            if (selectedDatasets.includes(8)) {
                webmap.add(parksAndGardens);
            }
            if (selectedDatasets.includes(9)) {
                webmap.add(publicElementarySchools);
            }
            if (selectedDatasets.includes(10)) {
                webmap.add(publicHighSchools);
            }
            if (selectedDatasets.includes(11)) {
                webmap.add(publicMiddleSchools);
            }
            if (selectedDatasets.includes(12)) {
                webmap.add(restaurants);
            }
            if (selectedDatasets.includes(13)) {
                webmap.add(retailFoodMarkets);
            }
            if (selectedDatasets.includes(14)) {
                webmap.add(supermarketsAndGroceryStores);
            }
            if (selectedDatasets.includes(15)) {
                webmap.add(wicFoodRetailer);
            }

            const mapView = new MapView({
                container: mapViewRef.current,
                map: webmap
            });

            mapViewRef.current = mapView;

            await mapView.when();

            let lv; // Declare it outside the loop

            for (const dataset of datasets) {
                if (selectedDatasets.includes(dataset.id) && dataset.dataSource) { // Check if this dataset is selected
                    lv = await mapView.whenLayerView(dataset.dataSource); // Assign to the outer variable
                }
            }

            layerView = lv; // Now, this should have the correct value      

            // Wait for the mapView to finish updating after the zoom operation
            await new Promise<void>(resolve => {
                const handle = mapView.watch('updating', updating => {
                    if (!updating) {
                        handle.remove();
                        resolve();
                    }
                });
            });

            const screenshotDataUrl = await handleScreenshot();
            setMapScreenshotData(screenshotDataUrl);
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

    const createMask = (geometry) => {
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

    const filterPointsWithinPolygon = (polygonGeometry) => {
        // Set a spatial filter on the layer view
        layerView.filter = {
            geometry: polygonGeometry,
            spatialRelationship: "intersects"
        };
    };

    const waitForLayerViewUpdate = () => {
        return new Promise<void>(resolve => {
            if (!layerView.updating) {
                resolve();
            } else {
                const handle = layerView.watch('updating', updating => {
                    if (!updating) {
                        handle.remove();
                        resolve();
                    }
                });
            }
        });
    };

    const getPointsInsideFeature = () => {
        // Define query parameters
        const query = layerView.layer.createQuery();
        query.geometry = layerView.filter.geometry; // We use the filter geometry
        query.spatialRelationship = "intersects";

        return layerView.queryFeatures(query)
            .then(result => {
                return result.features.length;
            });
    };

    /**
     * Handle the click event to generate the PDF report.
     */
    const handleReportClick = async () => {
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
            mapView.when(() => {
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

                mapView.goTo({ target: extXY })
                    .then(() => {
                        return new Promise<void>(resolve => {
                            const handle = mapView.watch('updating', updating => {
                                if (!updating) {
                                    handle.remove();
                                    resolve();
                                }
                            });
                        });
                    })
                    .then(() => createMask(record.geometry))
                    .then(() => filterPointsWithinPolygon(record.geometry))
                    .then(() => waitForLayerViewUpdate())
                    .then(() => getPointsInsideFeature())
                    .then(pointsInsideFeature => {
                        return waitForLayerViewUpdate();
                    })
                    .then(() => handleScreenshot())
                    .then(async (dataUrl) => {
                        setMapScreenshotData(dataUrl);

                        // Here's where you get the image dimensions:
                        try {

                            const dimensions = await getImageDimensions(dataUrl);
                            setImageDimensions(dimensions);

                        } catch (error) {
                            console.error("Error getting image dimensions:", error);
                        }


                    })
                    .catch(error => {
                        console.error("Error updating map view or capturing screenshot:", error);
                    });
            });
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

                <div style={mapStyle} ref={mapViewRef}>
                </div>
                <div className="record-list" id="reportForm" style={reportFormStyle}>
                    <label style={{ display: 'block', marginBottom: '10px' }}>Please select your boundary type:</label>
                    <select
                        onChange={(event) => setBoundaryType(event.target.value)}
                        style={dropdownStyle}
                    >
                        <option value="" disabled selected>Select a boundary type</option>
                        <option value="City">City</option>
                        <option value="Countywide Statistical Area (CSA)">Countywide Statistical Area (CSA)</option>
                        <option value="Census Tract">Census Tract</option>
                        <option value="LA City Council Districts">LA City Council Districts</option>
                        <option value="Neighborhood">Neighborhood</option>
                        <option value="Service Planning Area (SPA)">Service Planning Area (SPA)</option>
                        <option value="Supervisor District">Supervisor District</option>
                    </select>

                    <label style={{ display: 'block', marginTop: '20px', marginBottom: '10px' }}>Please choose your boundary:</label>
                    <select onChange={handleDropdownChange} style={dropdownStyle}>
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

                    <div style={{ ...dropdownStyle, overflowY: 'auto', maxHeight: '150px', border: '1px solid #ccc', borderRadius: '4px' }}>
                        {datasets.map(dataset => (
                            <div key={dataset.id} style={{ padding: '8px', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedDatasets.includes(dataset.id)}
                                    onChange={() => handleDatasetChange(dataset.id)}
                                    style={{ marginRight: '8px' }}
                                />
                                {dataset.name}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
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
                        zIndex: 1500,
                        backgroundColor: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px solid black',
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
                                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button onClick={handleDownload} style={{ margin: '10px' }}>Download PDF</button>
                                    <button onClick={() => setShowPDFPane(false)} style={{ margin: '10px' }}>Close</button>
                                </div>
                                <div style={{ width: '90%', height: '80%', overflow: 'auto' }}>
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

    /**
     * Download the generated PDF report.
     */
    const handleDownload = () => {
        const blobURL = URL.createObjectURL(pdfBlob);
        const tempLink = document.createElement('a');
        tempLink.href = blobURL;
        tempLink.setAttribute('download', 'report.pdf');
        tempLink.click();
    };

    return (
        <div className="widget-use-feature-layer" style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
            <DataSourceComponent useDataSource={props.useDataSources[0]} query={getQuery()} widgetId={props.id} queryCount>
                {dataRender}
            </DataSourceComponent>
        </div>
    );
}




