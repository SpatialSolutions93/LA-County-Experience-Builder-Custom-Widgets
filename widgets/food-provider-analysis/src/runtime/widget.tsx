import { React, DataSourceComponent, AllWidgetProps } from "jimu-core";
import type { DataSource } from "jimu-core";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import Extent from "@arcgis/core/geometry/Extent.js";
import Graphic from "@arcgis/core/Graphic";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import "./widgetStyles.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import * as Logos from "./logos";
import { generateLegendItems } from "./utils/legendUtils";
import {
  customButtonStyle,
  customContainerStyle,
  mapStyle,
  reportButtonStyle,
  viewReportButtonStyle,
  viewReportButtonHoverStyle,
  viewUseCaseButtonStyle,
  viewUseCaseButtonHoverStyle,
  reportFormStyle,
  useCaseFormStyle,
  dropdownStyle,
  customPdfCloseButton,
  customPdfCloseButtonHover,
} from "./utils/customStyles";
import {
  useDatasetChangeHandler,
  handleDropdownChange,
} from "./utils/formLogic";
import {
  createMask,
  filterPointsWithinPolygon,
  getPointsInsideFeature,
} from "./utils/geospatialProcessing";
import { JimuMapViewComponent } from "jimu-arcgis";
import Sketch from "@arcgis/core/widgets/Sketch.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import { set } from "seamless-immutable";
import { last } from "lodash-es";

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
  const mapViewRef2 = useRef(null);
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
  const [selectedRecordIndex, setSelectedRecordIndex] = React.useState("");
  const [showPDFPane, setShowPDFPane] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);
  const [pdfGenerationComplete, setPdfGenerationComplete] = useState(false);
  const [boundaryType, setBoundaryType] = useState<string | null>(null);
  const [useCaseType, setUseCaseType] = useState("");
  const [UseLabelColor, setUseLabelColor] = useState("black"); // Default color
  const [UseLabelFontWeight, setUseLabelFontWeight] = useState("normal");
  const [SelLabelColor, setSelLabelColor] = useState("black"); // Default color
  const [SelLabelFontWeight, setSelLabelFontWeight] = useState("normal");
  const [BndryLabelColor, setBndryLabelColor] = useState("black"); // Default color
  const [BndryLabelFontWeight, setBndryLabelFontWeight] = useState("normal");
  const [DatLabelColor, setDatLabelColor] = useState("black"); // Default color
  const [DatLabelFontWeight, setDatLabelFontWeight] = useState("normal");
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1);
  const [mapScreenshotDataArray, setMapScreenshotDataArray] = useState([]);
  const progressCtrRef = React.useRef(0);
  const slideCtrRef = React.useRef(0);
  const [blobURL, setBlobURL] = useState(null);
  const [farmersMarkets, setFarmersMarkets] = useState<FeatureLayer | null>(
    null
  );
  const [calFreshFoodRetailer, setCalFreshFoodRetailer] =
    useState<FeatureLayer | null>(null);
  const [calFreshRestaurant, setCalFreshRestaurant] =
    useState<FeatureLayer | null>(null);
  const [communityGardens, setCommunityGardens] = useState<FeatureLayer | null>(
    null
  );
  const [foodPantry, setFoodPantry] = useState<FeatureLayer | null>(null);
  const [parks, setParks] = useState<FeatureLayer | null>(null);
  const [parksAndGardens, setParksAndGardens] = useState<FeatureLayer | null>(
    null
  );
  const [poverty, setPoverty] = useState<FeatureLayer | null>(null); // NEW
  const [publicElementarySchools, setPublicElementarySchools] =
    useState<FeatureLayer | null>(null);
  const [publicHighSchools, setPublicHighSchools] =
    useState<FeatureLayer | null>(null);
  const [publicMiddleSchools, setPublicMiddleSchools] =
    useState<FeatureLayer | null>(null);
  const [restaurants, setRestaurants] = useState<FeatureLayer | null>(null);
  const [retailFoodMarkets, setRetailFoodMarkets] =
    useState<FeatureLayer | null>(null);
  const [wicFoodRetailer, setWicFoodRetailer] = useState<FeatureLayer | null>(
    null
  );
  const [calFreshCases, setCalFreshCases] = useState<FeatureLayer | null>(null);
  const [calFreshGap, setCalFreshGap] = useState<FeatureLayer | null>(null);
  const [foodInsecurity, setFoodInsecurity] = useState<FeatureLayer | null>(
    null
  );
  const [obesity, setObesity] = useState<FeatureLayer | null>(null);
  const [diabetes, setDiabetes] = useState<FeatureLayer | null>(null);
  const [heartDisease, setHeartDisease] = useState<FeatureLayer | null>(null);
  const [depression, setDepression] = useState<FeatureLayer | null>(null);
  const [income, setIncome] = useState<FeatureLayer | null>(null);
  const [hispanic, setHispanic] = useState<FeatureLayer | null>(null);
  const [race, setRace] = useState<FeatureLayer | null>(null);
  const [age, setAge] = useState<FeatureLayer | null>(null);
  const [englishSecondLanguage, setEnglishSecondLanguage] =
    useState<FeatureLayer | null>(null);
  const [immigrationStatus, setImmigrationStatus] =
    useState<FeatureLayer | null>(null);
  const [vehicleOwnershipLandowners, setVehicleOwnershipLandowners] =
    useState<FeatureLayer | null>(null);
  const [vehicleOwnershipRenters, setVehicleOwnershipRenters] =
    useState<FeatureLayer | null>(null);
  const [householdSize, setHouseholdSize] = useState<FeatureLayer | null>(null);
  const [disability, setDisability] = useState<FeatureLayer | null>(null);
  const [healthInsurance, setHealthInsurance] = useState<FeatureLayer | null>(
    null
  );
  const [healthyPlacesIndex, setHealthyPlacesIndex] =
    useState<FeatureLayer | null>(null);
  const [socialVulnerabilityIndex, setSocialVulnerabilityIndex] =
    useState<FeatureLayer | null>(null);
  const [redlining, setRedlining] = useState<FeatureLayer | null>(null);
  const [globalLegendData, setGlobalLegendData] = React.useState({});
  const [globalSymbol, setGlobalSymbol] = React.useState<Record<string, any>>(
    {}
  );
  const pointsInsideFeatureCountRef = React.useRef(null);
  const [usingCustomBoundary, setUsingCustomBoundary] = React.useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHoveredUseCase, setIsHoveredUseCase] = useState(false);
  const [isHoveredReport, setIsHoveredReport] = useState(false);
  const [jimuMapView, setJimuMapView] = useState(null);
  const [sketchWidget, setSketchWidget] = useState(null);
  const [sketchLayer, setSketchLayer] = useState(null);
  const [lastGraphicGeometry, setLastGraphicGeometry] = useState(null); // State to hold the geometry
  const [customBoundarySelected, setCustomBoundarySelected] = useState(false);

  const handleSketchWidget = (jimuMapView) => {
    if (!jimuMapView || !jimuMapView.view) return;

    // Remove any existing sketch widget
    removeSketchWidget(jimuMapView);

    // Create a new GraphicsLayer for the Sketch widget
    const newSketchLayer = new GraphicsLayer();
    jimuMapView.view.map.add(newSketchLayer); // Adding directly to the map object

    // Setup the Sketch widget
    setupSketchWidget(newSketchLayer, jimuMapView.view);
  };

  const setupSketchWidget = (layer, view) => {
    const sketch = new Sketch({
      layer: layer,
      view: view,
      availableCreateTools: ["polygon", "rectangle"],
    });

    sketch.on("create", (event) => {
      if (event.state === "complete") {
        layer.removeAll();
        layer.add(event.graphic);
        setLastGraphicGeometry(event.graphic.geometry);
      }
    });

    view.ui.add(sketch, "bottom-right");
    setSketchWidget(sketch);
  };

  const removeSketchWidget = (jimuMapView) => {
    if (!jimuMapView || !jimuMapView.view) return;

    // Assuming the sketch widget is globally or otherwise stored
    if (sketchWidget) {
      jimuMapView.view.ui.remove(sketchWidget);
      sketchWidget.layer && jimuMapView.view.map.remove(sketchWidget.layer);
      setSketchWidget(null);
    }
  };

  useEffect(() => {
    if (usingCustomBoundary && jimuMapView) {
      handleSketchWidget(jimuMapView);
    } else if (!usingCustomBoundary && jimuMapView) {
      removeSketchWidget(jimuMapView);
    }

    // Cleanup function to remove the Sketch widget when the widget unmounts
    return () => {
      if (jimuMapView) {
        removeSketchWidget(jimuMapView);
      }
    };
  }, [usingCustomBoundary, jimuMapView]);

  const onActiveViewChange = (jimuMapView) => {
    setJimuMapView(jimuMapView);
  };

  useEffect(() => {
    const LACountyWebMap = new WebMap({
      portalItem: {
        id: "2bc29891fc744b62b57de017897583e0",
      },
    });

    async function loadAndSetLayer(groupLayer, index, setter) {
      try {
        const layer = groupLayer.layers.getItemAt(index) as FeatureLayer;
        await layer.load();
        setter(layer);
      } catch (error) {
        console.error("Error loading layer: ", error);
      }
    }

    LACountyWebMap.load()
      .then(() => {
        const foodAssistanceAndBenefits = LACountyWebMap.layers.getItemAt(
          7
        ) as GroupLayer;
        foodAssistanceAndBenefits.load().then(() => {
          // Load and set each layer
          loadAndSetLayer(foodAssistanceAndBenefits, 5, setCalFreshCases);
          loadAndSetLayer(foodAssistanceAndBenefits, 4, setCalFreshGap);
          loadAndSetLayer(
            foodAssistanceAndBenefits,
            3,
            setCalFreshFoodRetailer
          );
          loadAndSetLayer(foodAssistanceAndBenefits, 2, setCalFreshRestaurant);
          loadAndSetLayer(foodAssistanceAndBenefits, 1, setWicFoodRetailer);
          loadAndSetLayer(foodAssistanceAndBenefits, 0, setFoodPantry);
        });

        const retailFoodOutlets = LACountyWebMap.layers.getItemAt(
          6
        ) as GroupLayer;
        retailFoodOutlets.load().then(() => {
          const restaurants_GroupLayer = retailFoodOutlets.layers.getItemAt(
            3
          ) as GroupLayer;
          restaurants_GroupLayer.load().then(() => {
            loadAndSetLayer(restaurants_GroupLayer, 2, setRestaurants); // Adjust if more layers need to be loaded
          });

          const retailFoodMarkets_GroupLayer =
            retailFoodOutlets.layers.getItemAt(2) as GroupLayer;
          retailFoodMarkets_GroupLayer.load().then(() => {
            loadAndSetLayer(
              retailFoodMarkets_GroupLayer,
              2,
              setRetailFoodMarkets
            ); // Adjust if more layers need to be loaded
          });

          loadAndSetLayer(retailFoodOutlets, 1, setFarmersMarkets); // Loading directly as it's a feature layer
        });

        const residentHealth_GroupLayer = LACountyWebMap.layers.getItemAt(
          5
        ) as GroupLayer;
        residentHealth_GroupLayer.load().then(() => {
          const depression_GroupLayer =
            residentHealth_GroupLayer.layers.getItemAt(0) as GroupLayer;
          depression_GroupLayer.load().then(() => {
            loadAndSetLayer(depression_GroupLayer, 2, setDepression);
          });
          const heartDisease_GroupLayer =
            residentHealth_GroupLayer.layers.getItemAt(1) as GroupLayer;
          heartDisease_GroupLayer.load().then(() => {
            loadAndSetLayer(heartDisease_GroupLayer, 3, setHeartDisease);
          });
          const diabetes_GroupLayer =
            residentHealth_GroupLayer.layers.getItemAt(2) as GroupLayer;
          diabetes_GroupLayer.load().then(() => {
            loadAndSetLayer(diabetes_GroupLayer, 3, setDiabetes);
          });

          const obesity_GroupLayer = residentHealth_GroupLayer.layers.getItemAt(
            3
          ) as GroupLayer;
          obesity_GroupLayer.load().then(() => {
            loadAndSetLayer(obesity_GroupLayer, 3, setObesity);
          });

          // Asynchronously load each layer in the Resident Health Group and set their respective states
          loadAndSetLayer(residentHealth_GroupLayer, 4, setFoodInsecurity);
        });

        const demographics = LACountyWebMap.layers.getItemAt(4) as GroupLayer;
        demographics.load().then(() => {
          const race_GroupLayer = demographics.layers.getItemAt(
            7
          ) as GroupLayer;
          race_GroupLayer.load().then(() => {
            const nothispanic2022_GroupLayer = race_GroupLayer.layers.getItemAt(
              10
            ) as GroupLayer;
            nothispanic2022_GroupLayer.load().then(() => {
              loadAndSetLayer(nothispanic2022_GroupLayer, 0, setRace);
            });
          });

          const age_GroupLayer = demographics.layers.getItemAt(4) as GroupLayer;
          age_GroupLayer.load().then(() => {
            const age2022_GroupLayer = age_GroupLayer.layers.getItemAt(
              5
            ) as GroupLayer;
            age2022_GroupLayer.load().then(() => {
              loadAndSetLayer(age2022_GroupLayer, 1, setAge);
            });
          });
          const vehicleOwnership_GroupLayer = demographics.layers.getItemAt(
            3
          ) as GroupLayer;

          vehicleOwnership_GroupLayer.load().then(() => {
            const vehicleOwnershipLandowners_GroupLayer =
              vehicleOwnership_GroupLayer.layers.getItemAt(0) as GroupLayer;
            vehicleOwnershipLandowners_GroupLayer.load().then(() => {
              loadAndSetLayer(
                vehicleOwnershipLandowners_GroupLayer,
                5,
                setVehicleOwnershipLandowners
              );
            });
            const vehicleOwnershipRenters_GroupLayer =
              vehicleOwnership_GroupLayer.layers.getItemAt(1) as GroupLayer;
            vehicleOwnershipRenters_GroupLayer.load().then(() => {
              loadAndSetLayer(
                vehicleOwnershipRenters_GroupLayer,
                5,
                setVehicleOwnershipRenters
              );
            });
          });
          // Process each group layer within demographics and load their respective layers
          const groupsToLoad = [
            { groupIndex: 10, layerIndex: 5, setter: setIncome },
            { groupIndex: 9, layerIndex: 5, setter: setPoverty },
            { groupIndex: 8, layerIndex: 5, setter: setHispanic },
            { groupIndex: 6, layerIndex: 5, setter: setEnglishSecondLanguage },
            { groupIndex: 5, layerIndex: 5, setter: setImmigrationStatus },
            { groupIndex: 2, layerIndex: 5, setter: setHouseholdSize },
            { groupIndex: 1, layerIndex: 5, setter: setDisability },
            { groupIndex: 0, layerIndex: 6, setter: setHealthInsurance },
          ];

          groupsToLoad.forEach(({ groupIndex, layerIndex, setter }) => {
            const groupLayer = demographics.layers.getItemAt(
              groupIndex
            ) as GroupLayer;
            groupLayer
              .load()
              .then(() => {
                loadAndSetLayer(groupLayer, layerIndex, setter);
              })
              .catch((error) => {
                console.error(
                  `Error loading group layer at index ${groupIndex}:`,
                  error
                );
              });
          });
        });

        const neighborhoodCharacteristics_GroupLayer =
          LACountyWebMap.layers.getItemAt(3) as GroupLayer;
        neighborhoodCharacteristics_GroupLayer.load().then(() => {
          // Load each feature layer within the neighborhood characteristics group
          loadAndSetLayer(
            neighborhoodCharacteristics_GroupLayer,
            2,
            setHealthyPlacesIndex
          );
          loadAndSetLayer(
            neighborhoodCharacteristics_GroupLayer,
            1,
            setSocialVulnerabilityIndex
          );
          loadAndSetLayer(
            neighborhoodCharacteristics_GroupLayer,
            0,
            setRedlining
          );
        });

        const greenAndGardenSpaces = LACountyWebMap.layers.getItemAt(
          2
        ) as GroupLayer;
        greenAndGardenSpaces.load().then(() => {
          // Load each feature layer within the Green and Garden Spaces group
          loadAndSetLayer(greenAndGardenSpaces, 2, setCommunityGardens);
          loadAndSetLayer(greenAndGardenSpaces, 1, setParks);
          loadAndSetLayer(greenAndGardenSpaces, 0, setParksAndGardens);
        });

        const schools = LACountyWebMap.layers.getItemAt(1) as GroupLayer;
        schools.load().then(() => {
          // Load each feature layer within the Schools group
          loadAndSetLayer(schools, 2, setPublicElementarySchools);
          loadAndSetLayer(schools, 1, setPublicMiddleSchools);
          loadAndSetLayer(schools, 0, setPublicHighSchools);
        });
      })
      .catch((error) => {
        console.error("Error loading WebMap: ", error);
      });
  }, []);

  const datasets = [
    { id: 1, name: "Age", dataSource: age },
    { id: 2, name: "CalFresh Cases", dataSource: calFreshCases },
    {
      id: 3,
      name: "CalFresh Food Retailers",
      dataSource: calFreshFoodRetailer,
    },
    { id: 4, name: "CalFresh Gap", dataSource: calFreshGap },
    { id: 5, name: "CalFresh Restaurants", dataSource: calFreshRestaurant },
    { id: 6, name: "Community Gardens", dataSource: communityGardens },
    { id: 7, name: "Depression", dataSource: depression },
    { id: 8, name: "Detailed Race and Ethnicity", dataSource: race },
    { id: 9, name: "Diabetes", dataSource: diabetes },
    { id: 10, name: "Disability", dataSource: disability },
    {
      id: 11,
      name: "English Second Language",
      dataSource: englishSecondLanguage,
    },
    { id: 12, name: "Farmer's Markets", dataSource: farmersMarkets },
    { id: 13, name: "Food Insecurity", dataSource: foodInsecurity },
    { id: 14, name: "Food Pantries", dataSource: foodPantry },
    { id: 16, name: "Health Insurance", dataSource: healthInsurance },
    { id: 17, name: "Healthy Places Index", dataSource: healthyPlacesIndex },
    { id: 18, name: "Heart Disease", dataSource: heartDisease },
    { id: 19, name: "Hispanic or Latino", dataSource: hispanic },
    { id: 20, name: "Household Size", dataSource: householdSize },
    { id: 21, name: "Immigration Status", dataSource: immigrationStatus },
    { id: 22, name: "Income", dataSource: income },
    { id: 23, name: "Obesity", dataSource: obesity },
    { id: 24, name: "Parks", dataSource: parks },
    { id: 25, name: "Parks and Gardens", dataSource: parksAndGardens },
    { id: 26, name: "Poverty", dataSource: poverty }, // NEW
    {
      id: 27,
      name: "Public Elementary Schools",
      dataSource: publicElementarySchools,
    },
    { id: 28, name: "Public High Schools", dataSource: publicHighSchools },
    { id: 29, name: "Public Middle Schools", dataSource: publicMiddleSchools },
    { id: 30, name: "Redlining", dataSource: redlining },
    { id: 31, name: "Restaurants", dataSource: restaurants },
    { id: 32, name: "Retail Food Markets", dataSource: retailFoodMarkets },
    {
      id: 33,
      name: "Social Vulnerability Index",
      dataSource: socialVulnerabilityIndex,
    },
    {
      id: 34,
      name: "Vehicle Ownership (Landowners)",
      dataSource: vehicleOwnershipLandowners,
    },
    {
      id: 35,
      name: "Vehicle Ownership (Renters)",
      dataSource: vehicleOwnershipRenters,
    },
    { id: 36, name: "WIC Food Retailers", dataSource: wicFoodRetailer },
  ];

  function getDatasetName(datasetId) {
    const dataset = datasets.find((ds) => ds.id === datasetId);
    return dataset ? dataset.name : "Unknown Dataset";
  }

  const [neighborhoods] = useState(
    new FeatureLayer({
      portalItem: {
        id: "d6c55385a0e749519f238b77135eafac",
      },
    })
  );

  const [cities] = useState(
    new FeatureLayer({
      url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/19",
    })
  );

  const [CSA] = useState(
    new FeatureLayer({
      url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/23",
    })
  );

  const [censusTracts] = useState(
    new FeatureLayer({
      url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Demographics/MapServer/14",
    })
  );

  const [LACityCouncilDistricts] = useState(
    new FeatureLayer({
      url: "https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13",
    })
  );

  const [servicePlanningAreas] = useState(
    new FeatureLayer({
      url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/23",
    })
  );

  const [supervisorDistricts] = useState(
    new FeatureLayer({
      url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/27",
    })
  );

  const ATTRIBUTE_MAP = {
    Neighborhood: "name",
    City: "CITY_NAME",
    "Countywide Statistical Area (CSA)": "LABEL",
    "Census Tract": "CT20",
    "LA City Council Districts": "NAME",
    "Service Planning Area (SPA)": "SPA_NAME",
    "Supervisor District": "LABEL",
  };

  React.useEffect(() => {
    if (isFetchingData) {
      const interval = setInterval(() => {
        setLoadingDots((prev) => (prev === 7 ? 1 : prev + 1));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isFetchingData]);

  React.useEffect(() => {
    const sortByAttribute = (features, attribute) => {
      return features.sort((a, b) =>
        a.attributes[attribute].localeCompare(b.attributes[attribute])
      );
    };

    // Set usingCustomBoundary to true if "Custom" is selected
    if (boundaryType === "Custom") {
      setUsingCustomBoundary(true);
    } else if (boundaryType) {
      setUsingCustomBoundary(false); // Reset to false when another option is selected
      setIsFetchingData(true); // Start fetching when there's an actual boundary type
    }

    if (boundaryType === "Neighborhood") {
      neighborhoods.queryFeatures().then((featureSet) => {
        setNeighborhoodList(sortByAttribute(featureSet.features, "name"));
        setIsFetchingData(false);
      });
    } else if (boundaryType === "City") {
      cities.queryFeatures().then((featureSet) => {
        setCityList(sortByAttribute(featureSet.features, "CITY_NAME"));
        setIsFetchingData(false);
      });
    } else if (boundaryType === "Census Tract") {
      censusTracts.queryFeatures().then((featureSet) => {
        setCensusTractList(sortByAttribute(featureSet.features, "CT20"));
        setIsFetchingData(false);
      });
    } else if (boundaryType === "LA City Council Districts") {
      LACityCouncilDistricts.queryFeatures().then((featureSet) => {
        setCityCouncilDistrictsList(
          sortByAttribute(featureSet.features, "NAME")
        );
        setIsFetchingData(false);
      });
    } else if (boundaryType === "Service Planning Area (SPA)") {
      servicePlanningAreas.queryFeatures().then((featureSet) => {
        setServicePlanningAreaList(
          sortByAttribute(featureSet.features, "SPA_NAME")
        );
        setIsFetchingData(false);
      });
    } else if (boundaryType === "Supervisor District") {
      supervisorDistricts.queryFeatures().then((featureSet) => {
        setSupervisorDistrictList(
          sortByAttribute(featureSet.features, "LABEL")
        );
        setIsFetchingData(false);
      });
    } else if (boundaryType === "Countywide Statistical Area (CSA)") {
      CSA.queryFeatures().then((featureSet) => {
        setCSAList(sortByAttribute(featureSet.features, "LABEL"));
        setIsFetchingData(false);
      });
    }
  }, [
    boundaryType,
    neighborhoods,
    cities,
    censusTracts,
    LACityCouncilDistricts,
    servicePlanningAreas,
    supervisorDistricts,
    CSA,
  ]);

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
    //setCustomBoundarySelected(false);
    setCustomBoundarySelected(false);
    setUsingCustomBoundary(false);
    setBoundaryType(""); // Reset boundary type
    setSelectedRecordIndex("");
    setSelectedDatasets([]); // Reset selected datasets
    setLastGraphicGeometry(null); // Reset the last graphic geometry
    setUseCaseType(""); // Reset use case type
    setBndryLabelColor("black");
    setBndryLabelFontWeight("normal");
    setSelLabelColor("black");
    setSelLabelFontWeight("normal");
    setUseLabelColor("black");
    setUseLabelFontWeight("normal");
    setDatLabelColor("black");
    setDatLabelFontWeight("normal");
  };

  const handleCloseUseCase = () => {
    // Hide the report form
    const reportForm = document.getElementById("useCaseForm");
    if (reportForm) {
      reportForm.style.visibility = "hidden";
    }

    // Reset the form data
    //setCustomBoundarySelected(false);
    setCustomBoundarySelected(false);
    setUsingCustomBoundary(false);
    setBoundaryType(""); // Reset boundary type
    setSelectedRecordIndex("");
    setSelectedDatasets([]); // Reset selected datasets
    setLastGraphicGeometry(null); // Reset the last graphic geometry
    setUseCaseType(""); // Reset use case type
    setBndryLabelColor("black");
    setBndryLabelFontWeight("normal");
    setSelLabelColor("black");
    setSelLabelFontWeight("normal");
    setUseLabelColor("black");
    setUseLabelFontWeight("normal");
    setDatLabelColor("black");
    setDatLabelFontWeight("normal");
  };

  const attributeKey = ATTRIBUTE_MAP[boundaryType];

  const featureName =
    selectedRecord?.attributes?.[attributeKey] || "Custom Boundary";

  // 1. Setup the map and layers for the selected feature
  const [webmap] = useState(new WebMap({ basemap: "topo-vector" }));

  const handleScreenshot = async () => {
    const mapView = mapViewRef2.current;
    const screenshotArea = {
      x: 0,
      y: 0,
      width: mapView.width,
      height: mapView.height,
    };

    const screenshot = await mapView.takeScreenshot({
      format: "png",
      area: screenshotArea,
      width: mapView.width * 10,
      height: mapView.height * 10,
    });

    return screenshot.dataUrl;
  };

  let layerViews = {};

  const initializeMapView = async () => {
    if (mapViewRef.current) {
      if (selectedDatasets.includes(1)) {
        webmap.add(age);
      }

      if (selectedDatasets.includes(2)) {
        webmap.add(calFreshCases);
      }

      if (selectedDatasets.includes(3)) {
        webmap.add(calFreshFoodRetailer);
      }

      if (selectedDatasets.includes(4)) {
        webmap.add(calFreshGap);
      }

      if (selectedDatasets.includes(5)) {
        webmap.add(calFreshRestaurant);
      }

      if (selectedDatasets.includes(6)) {
        webmap.add(communityGardens);
      }

      if (selectedDatasets.includes(7)) {
        webmap.add(depression);
      }

      if (selectedDatasets.includes(8)) {
        webmap.add(race);
      }

      if (selectedDatasets.includes(9)) {
        webmap.add(diabetes);
      }

      if (selectedDatasets.includes(10)) {
        webmap.add(disability);
      }

      if (selectedDatasets.includes(11)) {
        webmap.add(englishSecondLanguage);
      }

      if (selectedDatasets.includes(12)) {
        webmap.add(farmersMarkets);
      }

      if (selectedDatasets.includes(13)) {
        webmap.add(foodInsecurity);
      }

      if (selectedDatasets.includes(14)) {
        webmap.add(foodPantry);
      }

      if (selectedDatasets.includes(16)) {
        webmap.add(healthInsurance);
      }

      if (selectedDatasets.includes(17)) {
        webmap.add(healthyPlacesIndex);
      }

      if (selectedDatasets.includes(18)) {
        webmap.add(heartDisease);
      }

      if (selectedDatasets.includes(19)) {
        webmap.add(hispanic);
      }

      if (selectedDatasets.includes(20)) {
        webmap.add(householdSize);
      }

      if (selectedDatasets.includes(21)) {
        webmap.add(immigrationStatus);
      }

      if (selectedDatasets.includes(22)) {
        webmap.add(income);
      }

      if (selectedDatasets.includes(23)) {
        webmap.add(obesity);
      }

      if (selectedDatasets.includes(24)) {
        webmap.add(parks);
      }

      if (selectedDatasets.includes(25)) {
        webmap.add(parksAndGardens);
      }

      if (selectedDatasets.includes(26)) {
        webmap.add(poverty);
      }

      if (selectedDatasets.includes(27)) {
        webmap.add(publicElementarySchools);
      }

      if (selectedDatasets.includes(28)) {
        webmap.add(publicHighSchools);
      }

      if (selectedDatasets.includes(29)) {
        webmap.add(publicMiddleSchools);
      }

      if (selectedDatasets.includes(30)) {
        webmap.add(redlining);
      }

      if (selectedDatasets.includes(31)) {
        webmap.add(restaurants);
      }

      if (selectedDatasets.includes(32)) {
        webmap.add(retailFoodMarkets);
      }

      if (selectedDatasets.includes(33)) {
        webmap.add(socialVulnerabilityIndex);
      }

      if (selectedDatasets.includes(34)) {
        webmap.add(vehicleOwnershipLandowners);
      }

      if (selectedDatasets.includes(35)) {
        webmap.add(vehicleOwnershipRenters);
      }

      if (selectedDatasets.includes(36)) {
        webmap.add(wicFoodRetailer);
      }

      console.log("mapViewRef.current: ", mapViewRef.current);
      console.log("webmap: ", webmap);

      mapViewRef2.current = mapViewRef.current;

      const mapView = new MapView({
        container: mapViewRef2.current,
        map: webmap,
      });

      console.log("Map view: ", mapView);

      mapViewRef2.current = mapView;

      await mapView.when();

      for (const dataset of datasets) {
        if (selectedDatasets.includes(dataset.id) && dataset.dataSource) {
          const lv = await mapView.whenLayerView(dataset.dataSource);
          layerViews[dataset.id] = lv;
        }
      }

      // Wait for the mapView to finish updating after the zoom operation
      await new Promise<void>((resolve) => {
        const handle = mapView.watch("updating", (updating) => {
          if (!updating) {
            handle.remove();
            resolve();
          }
        });
      });
    }
  };

  const getImageDimensions = (
    base64String: string
  ): Promise<ImageDimensions> => {
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

  // Get the handler function from the custom hook
  const handleDatasetChange = useDatasetChangeHandler(
    selectedDatasets,
    setSelectedDatasets
  );

  function findLayerByDatasetId(datasetId) {
    const dataset = datasets.find((d) => d.id === datasetId);
    if (dataset) {
      return webmap.layers.find((layer) => layer === dataset.dataSource);
    }
    return null;
  }

  const generateTestPDF = async (globalLegendData) => {
    // Create a canvas for the basemap and polygon
    const canvas = document.createElement("canvas");
    const canvasWidth = 1920;
    const canvasHeight = 1080;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const selectedFeatureName = featureName;
    const averagePerSquareMile = "#";

    let title_page;

    const bullet = "\u2022"; // Unicode bullet point

    title_page = [
      {
        stack: [
          {
            columns: [
              {}, // Empty column for padding on the left side
              {
                text: `Food Availability in ${selectedFeatureName}`,
                style: "title_main",
                width: canvasWidth * 0.75, // 75% of the canvas width
                alignment: "center",
              },
              {}, // Empty column for padding on the right side
            ],
            // Add these if you want to balance out the space distributed to each column
            columnGap: 0,
            widths: ["12.5%", "75%", "12.5%"],
          },
          {
            text: `Generated on ${new Date().toLocaleDateString()}`, // This will display the current date
            style: "date_style",
            margin: [0, 50],
          },
        ],
        margin: [0, -150],
      },
      {
        columns: [
          {
            image: Logos.LACounty_logo,
            height: 400,
            width: 400,
            absolutePosition: { x: 368, y: 610 },
          },
          {
            image: Logos.USC_logo,
            height: 240,
            width: 584,
            absolutePosition: { x: 1056, y: 708 },
          },
        ],
      },
    ];

    const overlap = 10; // Set the thickness of your outline

    function generateSlideForDataset(datasetId, datasetName) {
      console.log("datasetId: ", datasetId);
      const coloredLine = {
        canvas: [
          {
            type: "line",
            x1: -10,
            y1: 210,
            x2: 720,
            y2: 210,
            lineWidth: 4,
            lineColor: "#4472C4",
          },
        ],
        margin: [0, 0, 0, 220],
      };

      let textGroup;

      if (selectedFeatureName === "Alhambra") {
        if (datasetName === "CalFresh Food Retailers") {
          textGroup = {
            stack: [
              {
                text: `${bullet} 42 ${datasetName} in ${selectedFeatureName}`,
                style: "bodyText",
              },
              {
                text: `${bullet} 1 ${datasetName} for every 1,934 people`,
                style: "bodyText",
              },
              {
                text: `${bullet} 5.5 ${datasetName} every square mile`,
                style: "bodyText",
              },
            ],
            margin: [0, -183, 0, 0], // Adjust this margin to move the entire group up by 200 units
          };
        } else if (datasetName === "Retail Food Markets") {
          textGroup = {
            stack: [
              {
                text: `${bullet} 82 ${datasetName} in ${selectedFeatureName}`,
                style: "bodyText",
              },
              {
                text: `${bullet} 1 ${datasetName} for every 990 people`,
                style: "bodyText",
              },
              {
                text: `${bullet} 10.75 ${datasetName} every square mile`,
                style: "bodyText",
              },
            ],
            margin: [0, -183, 0, 0], // Adjust this margin to move the entire group up by 200 units
          };
        } else if (datasetName === "WIC Food Retailers") {
          textGroup = {
            stack: [
              {
                text: `${bullet} 4 ${datasetName} in ${selectedFeatureName}`,
                style: "bodyText",
              },
              {
                text: `${bullet} 1 ${datasetName} for every 20,303 people`,
                style: "bodyText",
              },
              {
                text: `${bullet} .52 ${datasetName} every square mile`,
                style: "bodyText",
              },
            ],
            margin: [0, -183, 0, 0], // Adjust this margin to move the entire group up by 200 units
          };
        }
      } else if (selectedFeatureName === "San Marino") {
        if (datasetName === "CalFresh Food Retailers") {
          textGroup = {
            stack: [
              {
                text: `${bullet} 0 ${datasetName} in ${selectedFeatureName}`,
                style: "bodyText",
              },
            ],
            margin: [0, -183, 0, 0], // Adjust this margin to move the entire group up by 200 units
          };
        } else if (datasetName === "Retail Food Markets") {
          textGroup = {
            stack: [
              {
                text: `${bullet} 1 ${datasetName} in ${selectedFeatureName}`,
                style: "bodyText",
              },
              {
                text: `${bullet} 1 ${datasetName} for every 12,254 people`,
                style: "bodyText",
              },
              {
                text: `${bullet} .27 ${datasetName} every square mile`,
                style: "bodyText",
              },
            ],
            margin: [0, -183, 0, 0], // Adjust this margin to move the entire group up by 200 units
          };
        } else if (datasetName === "WIC Food Retailers") {
          textGroup = {
            stack: [
              {
                text: `${bullet} 0 ${datasetName} in ${selectedFeatureName}`,
                style: "bodyText",
              },
            ],
            margin: [0, -183, 0, 0], // Adjust this margin to move the entire group up by 200 units
          };
        }
      } else {
        textGroup = {
          stack: [
            {
              text: `${bullet} ${pointsInsideFeatureCountRef.current} ${datasetName} in ${selectedFeatureName}`,
              style: "bodyText",
            },
            {
              text: `${bullet} 1 ${datasetName} for every [#] people`,
              style: "bodyText",
            },
            {
              text: `${bullet} ${averagePerSquareMile} ${datasetName} every square mile`,
              style: "bodyText",
            },
          ],
          margin: [0, -183, 0, 0], // Adjust this margin to move the entire group up by 200 units
        };
      }

      const headerWithRectangles = {
        stack: [
          {
            canvas: [
              {
                type: "rect",
                x: -82,
                y: 225, // Starting position
                w: 30,
                h: 120,
                color: "#FFCC00",
              },
              {
                type: "rect",
                x: -104,
                y: 225, // Adjust based on the desired space between the rectangles
                w: 10,
                h: 120,
                color: "#FFCC00",
              },
            ],
          },
          {
            text: datasetName,
            style: "header",
            margin: [65, -100, 0, -200],
            alignment: "left",
          }, // Adjust the margin as per your requirements for fine-tuning
        ],
        margin: [0, 0, 0, 20],
      };

      const legendDataForDataset = globalLegendData[datasetId] || [];
      // Assuming this is called within a component that has access to `globalSymbol`
      const currentSymbolType = globalSymbol[datasetId] || "no-symbol"; // Use a default/fallback symbol type if needed
      let legendItems = generateLegendItems(
        legendDataForDataset,
        currentSymbolType
      );

      // Group the legend items into columns, each with two items
      const legendColumns = [];
      for (let i = 0; i < legendItems.length; i += 2) {
        // Prepare a column with two items
        const column = {
          stack: legendItems.slice(i, i + 2), // Get two items for the column
          margin: [0, 0, 0, 5], // Margin between items in the column
        };
        legendColumns.push(column);
      }

      // Now create a row with all the columns aligned horizontally
      const legendRow = {
        columns: legendColumns.map((column) => ({
          ...column,
          width: "auto", // Each column only takes up the space it needs
        })),
        columnGap: 30, // No horizontal space between columns
      };

      // Adjust the layout for each column within legendRow to ensure proper width
      legendColumns.forEach((column) => {
        column.width = "auto"; // Set the width of the column to be automatic
      });

      // Start with the initial parts of the statistics that are always included
      let statistics = [
        headerWithRectangles,
        coloredLine,
        textGroup,
        {
          columns: [
            {
              image: Logos.LACounty_logo,
              height: 250,
              width: 250,
              absolutePosition: { x: 20, y: 810 },
            },
            {
              image: Logos.USC_logo,
              height: 150,
              width: 365,
              absolutePosition: { x: 270, y: 928 },
            },
          ],
        },
      ];

      // Define statistics inside the function to ensure it's unique for each slide
      if (currentSymbolType !== "no-symbol") {
        // Append the legend parts to the statistics array
        statistics.push({
          columns: [
            {
              // This might be redundant if you're including a separate legend stack below
              // Remove this part if not needed
              text: "Legend",
              fontSize: 48,
              bold: true,
              absolutePosition: { x: 920, y: 878 },
            },
            {
              stack: [
                {
                  // The "Legend" title setup, assuming you need it
                  text: "Legend",
                  fontSize: 48,
                  bold: true,
                  absolutePosition: { x: 920, y: 878 },
                },
                legendRow, // Insert the dynamically generated legend items here
              ],
              // Adjust the positioning of the entire stack as necessary
              absolutePosition: { x: 920, y: 945 },
            },
          ],
        });
      }

      return {
        table: {
          widths: ["50%", "60%"],
          heights: [canvasHeight],
          body: [
            [
              {
                stack: statistics,
                margin: [65, 0], // 220
              },
              "",
            ],
          ],
        },
        layout: "noBorders",
      };
    }

    let dynamicSlides = [];

    for (let datasetId of selectedDatasets) {
      const datasetName = getDatasetName(datasetId);
      dynamicSlides.push(generateSlideForDataset(datasetId, datasetName));
    }

    console.log("dynamicSlides: ", dynamicSlides);

    const docDefinition = {
      // Background definition for the red rectangle and black outline
      background: function (currentPage, pageSize) {
        if (currentPage === 1) {
          // Return the rectangles for the first slide's background
          return {
            canvas: [
              // Outer rectangle with color #990000
              {
                type: "rect",
                x: (canvasWidth - (canvasWidth - 80)) / 2,
                y: (canvasHeight - (canvasHeight - 80)) / 2,
                w: canvasWidth - 80,
                h: canvasHeight - 80,
                lineWidth: 5,
                lineColor: "#990000",
              },
              // Inner rectangle with color #FFCC00
              {
                type: "rect",
                x: (canvasWidth - (canvasWidth - 90)) / 2,
                y: (canvasHeight - (canvasHeight - 90)) / 2,
                w: canvasWidth - 90,
                h: canvasHeight - 90,
                lineWidth: 5,
                lineColor: "#FFCC00",
              },
            ],
          };
        } else if (currentPage > 1) {
          return {
            canvas: [
              // Red rectangle
              {
                type: "rect",
                x: pageSize.width - 200,
                y: 0,
                w: 200,
                h: pageSize.height,
                color: "#990000",
              },
              // White border around the map
              {
                type: "rect",
                x: pageSize.width - 864 - 2 * overlap - 160,
                y: (canvasHeight - 647.3653281096964) / 2 - overlap - 40,
                w: 864 - 2 + 100,
                h: 647.3653281096964 - 2 + 100,
                color: "white",
                lineWidth: overlap - 8,
                lineColor: "white",
              },
              // Black border around the map
              {
                type: "rect",
                x: pageSize.width - 864 - 2 * overlap - 110,
                y: (canvasHeight - 647.3653281096964) / 2 - overlap + 10,
                w: 864 - 1,
                h: 647.3653281096964,
                lineWidth: overlap,
                lineColor: "black",
              },
            ],
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
                widths: ["100%"],
                heights: [canvasHeight],
                body: [
                  [
                    {
                      stack: title_page,
                      margin: [65, 320],
                    },
                  ],
                ],
              },
              layout: "noBorders",
            },
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
                absolutePosition: { x: 926, y: 216 }, // 214
              },
            ],
          };
        }),
      ],
      pageSize: { width: canvasWidth, height: canvasHeight },
      pageOrientation: "landscape",
      styles: {
        header: {
          fontSize: 76,
          color: "black",
          bold: true,
        },
        bodyText: {
          fontSize: 43,
          color: "black",
        },
        title_main: {
          fontSize: 116,
          color: "black",
          bold: true,
          alignment: "center",
        },
        date_style: {
          fontSize: 43,
          color: "black",
          alignment: "center",
        },
      },
    };

    console.log("docDefinition: ", docDefinition);

    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      console.log("Blob: ", blob);
      setPdfBlob(blob);
      setShowPDFPane(true);
    });
  };

  React.useEffect(() => {
    if (imageDimensions) {
      console.log("globalLegendData: ", globalLegendData);
      generateTestPDF(globalLegendData).then(() => {
        progressCtrRef.current += 1;
        console.log("Progress counter: ", progressCtrRef.current);
        if (progressCtrRef.current === slideCtrRef.current) {
          console.log("All screenshots have been processed.");
          setPdfGenerationComplete(true);
          setIsLoadingReport(false);

          handleCloseReport();

          // Reset the progress counter
          progressCtrRef.current = 0;
        }
      });
    }
  }, [imageDimensions]);

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

    const mapView = mapViewRef2.current;
    const record = selectedRecord;

    if ((!record || !record.geometry) && !lastGraphicGeometry) {
      console.error("Invalid record or geometry. Cannot generate report.");
      setIsLoadingReport(false);
      return;
    }

    let featureExtent;
    let sr;

    if (!lastGraphicGeometry) {
      // Zoom to the feature's extent if there is no last graphic geometry
      featureExtent = record.geometry.extent;
      sr = record.geometry.spatialReference;
    } else {
      // If last graphic geometry exists, use its extent and spatial reference
      featureExtent = lastGraphicGeometry.extent;
      sr = lastGraphicGeometry.spatialReference;
    }

    // Ensure that the featureExtent is valid before proceeding
    if (
      featureExtent &&
      featureExtent.xmin !== undefined &&
      featureExtent.ymin !== undefined &&
      featureExtent.xmax !== undefined &&
      featureExtent.ymax !== undefined
    ) {
      await mapView.when();

      mapView.graphics.removeAll();

      const extXY = new Extent({
        xmin: featureExtent.xmin,
        ymin: featureExtent.ymin,
        xmax: featureExtent.xmax,
        ymax: featureExtent.ymax,
        spatialReference: sr,
      });

      const fillSymbol = new SimpleFillSymbol({
        color: [0, 0, 0, 0], // This creates a fully transparent fill
        style: "solid",
        outline: {
          color: [0, 0, 255], // Blue color for the outline
          width: 2, // Adjust width as needed
        },
      });

      let graphic;

      if (!lastGraphicGeometry) {
        graphic = new Graphic({
          geometry: record.geometry,
          symbol: fillSymbol,
        });
      } else {
        graphic = new Graphic({
          geometry: lastGraphicGeometry,
          symbol: fillSymbol,
        });
      }

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

        mapView.goTo({ target: extXY });

        await new Promise<void>((resolve) => {
          const handle = mapView.watch("updating", (updating) => {
            if (!updating) {
              handle.remove();
              resolve();
            }
          });
        });

        if (!lastGraphicGeometry) {
          await createMask(mapViewRef2.current, record.geometry);
        } else {
          await createMask(mapViewRef2.current, lastGraphicGeometry);
        }

        if (!lastGraphicGeometry) {
          await filterPointsWithinPolygon(
            datasetId,
            layerViews, // This should be defined in your component state or context
            mapViewRef2, // This should be your useRef hook reference
            record.geometry,
            setGlobalLegendData, // Passing the setState function directly
            setGlobalSymbol
          );
        } else {
          await filterPointsWithinPolygon(
            datasetId,
            layerViews, // This should be defined in your component state or context
            mapViewRef2, // This should be your useRef hook reference
            lastGraphicGeometry,
            setGlobalLegendData, // Passing the setState function directly
            setGlobalSymbol
          );
        }

        const count = await getPointsInsideFeature(datasetId, layerViews);
        pointsInsideFeatureCountRef.current = count;

        await new Promise((resolve) => setTimeout(resolve, 2000));

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

      console.log("Screenshots: ", screenshots);

      // Update the state with the collected screenshots
      setMapScreenshotDataArray(screenshots);

      setCustomBoundarySelected(false);
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

  const onBoundaryTypeChange = (event) => {
    const selectedType = event.target.value;
    setBoundaryType(selectedType);

    // Check if the selected type is 'Custom'
    if (selectedType === "Custom") {
      console.log("Custom boundary selected.");
    } else {
      // Proceed with default handling if not 'Custom'
      handleDropdownChange(
        event,
        selectedType,
        {
          neighborhoodList,
          cityList,
          censusTractList,
          cityCouncilDistrictsList,
          servicePlanningAreaList,
          supervisorDistrictList,
          CSAList,
        },
        setSelectedRecordIndex,
        setSelectedRecord
      );
    }

    setBndryLabelColor(selectedType ? "black" : "red");
    setBndryLabelFontWeight(selectedType ? "normal" : "bold");
  };

  const onUseCaseTypeChange = (e) => {
    const selectedType = e.target.value;
    setUseCaseType(selectedType);
    // Reset styles when a valid use case is selected
    setUseLabelColor(selectedType ? "black" : "red");
    setUseLabelFontWeight(selectedType ? "normal" : "bold");
  };

  const handleSelectDataClick = () => {
    // Check if a use case is not selected
    if (!useCaseType) {
      setUseLabelColor("red");
      setUseLabelFontWeight("bold");
    } else {
      const reportForm = document.getElementById("reportForm");
      const useCaseForm = document.getElementById("useCaseForm");
      if (reportForm) {
        if (
          reportForm.style.visibility === "hidden" ||
          reportForm.style.visibility === ""
        ) {
          reportForm.style.visibility = "visible";
        } else {
          reportForm.style.visibility = "hidden";
        }
      }

      if (useCaseForm) {
        if (
          useCaseForm.style.visibility === "hidden" ||
          useCaseForm.style.visibility === ""
        ) {
          useCaseForm.style.visibility = "visible";
        } else {
          useCaseForm.style.visibility = "hidden";
        }
      }
    }

    // Logic to toggle visibility of report and use case forms
  };

  useEffect(() => {
    const reportForm = document.getElementById("reportForm");
    if (reportForm) {
      reportForm.style.visibility = "visible";
    }
  }, [customBoundarySelected]); // Only re-run the effect if customBoundarySelected changes

  const dataRender = (ds: DataSource) => {
    if (!ds) return null;

    dsRef.current = ds;

    const fName =
      props.useDataSources &&
      props.useDataSources[0] &&
      props.useDataSources[0].fields
        ? props.useDataSources[0].fields[0]
        : null;

    return (
      <>
        {usingCustomBoundary && (
          <div style={customContainerStyle}>
            <div
              style={customButtonStyle}
              onClick={() => {
                setUsingCustomBoundary(false);
                setBoundaryType(""); // Reset boundary type
                setSelectedRecordIndex("");
                setSelectedDatasets([]); // Reset selected datasets
                setLastGraphicGeometry(null); // Reset the last graphic geometry
                setUseCaseType(""); // Reset use case type
                setBndryLabelColor("black");
                setBndryLabelFontWeight("normal");
                setSelLabelColor("black");
                setSelLabelFontWeight("normal");
                setUseLabelColor("black");
                setUseLabelFontWeight("normal");
                setDatLabelColor("black");
                setDatLabelFontWeight("normal");
              }}
            >
              <b>Cancel</b>
            </div>
            <div
              id="Custom-Test"
              style={customButtonStyle}
              onClick={() => {
                setUsingCustomBoundary(false);
                setCustomBoundarySelected(true);
              }}
            >
              <b>Confirm Boundary</b>
            </div>
          </div>
        )}
        <div style={reportButtonStyle}>
          <button
            className="esri-widget--button border-0 select-tool-btn d-flex align-items-center justify-content-center"
            onClick={() => {
              const useCaseForm = document.getElementById("useCaseForm");
              const reportForm = document.getElementById("reportForm");
              if (useCaseForm) {
                if (
                  useCaseForm.style.visibility === "hidden" ||
                  useCaseForm.style.visibility === ""
                ) {
                  if (reportForm.style.visibility === "visible") {
                    reportForm.style.visibility = "hidden";
                    setUsingCustomBoundary(false);
                    setBoundaryType(""); // Reset boundary type
                    setSelectedRecordIndex("");
                    setSelectedDatasets([]); // Reset selected datasets
                    setLastGraphicGeometry(null); // Reset the last graphic geometry
                    setUseCaseType(""); // Reset use case type
                    setBndryLabelColor("black");
                    setBndryLabelFontWeight("normal");
                    setSelLabelColor("black");
                    setSelLabelFontWeight("normal");
                    setUseLabelColor("black");
                    setUseLabelFontWeight("normal");
                    setDatLabelColor("black");
                    setDatLabelFontWeight("normal");
                  } else if (
                    reportForm.style.visibility === "hidden" ||
                    reportForm.style.visibility === ""
                  ) {
                    useCaseForm.style.visibility = "visible";
                  }
                } else {
                  useCaseForm.style.visibility = "hidden";
                  setUsingCustomBoundary(false);
                  setBoundaryType(""); // Reset boundary type
                  setSelectedRecordIndex("");
                  setSelectedDatasets([]); // Reset selected datasets
                  setLastGraphicGeometry(null); // Reset the last graphic geometry
                  setUseCaseType(""); // Reset use case type
                  setBndryLabelColor("black");
                  setBndryLabelFontWeight("normal");
                  setSelLabelColor("black");
                  setSelLabelFontWeight("normal");
                  setUseLabelColor("black");
                  setUseLabelFontWeight("normal");
                  setDatLabelColor("black");
                  setDatLabelFontWeight("normal");
                }
              }
            }}
          >
            <span className="esri-icon esri-icon-media2"></span>
          </button>
        </div>

        <div style={mapStyle} ref={mapViewRef} id="reportMapView"></div>

        {(!usingCustomBoundary || customBoundarySelected) && (
          <div
            className="record-list"
            id="useCaseForm"
            style={useCaseFormStyle}
          >
            <button
              className="close-report-button"
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                zIndex: 3000,
              }}
              onClick={handleCloseUseCase}
            >
              ×
            </button>

            <label
              style={{
                display: "block",
                marginBottom: "10px",
                pointerEvents: "auto",
                color: UseLabelColor,
                fontWeight: UseLabelFontWeight,
              }}
            >
              Please select your use case:
            </label>
            <select
              value={useCaseType}
              style={dropdownStyle}
              onChange={onUseCaseTypeChange}
            >
              <option value="">Select a use case</option>
              <option value="Demographics">Demographics</option>
              <option value="Education">Education</option>
              <option value="Food Assistance">Food Assistance</option>
              <option value="Food Availability">Food Availability</option>
              <option value="Green Spaces">Green Spaces</option>
              <option value="Health">Health</option>
              <option value="Neighborhood Characteristics">
                Neighborhood Characteristics
              </option>
            </select>

            <button
              style={
                isHoveredUseCase
                  ? {
                      ...viewUseCaseButtonStyle,
                      ...viewUseCaseButtonHoverStyle,
                    }
                  : viewUseCaseButtonStyle
              }
              onMouseEnter={() => setIsHoveredUseCase(true)}
              onMouseLeave={() => setIsHoveredUseCase(false)}
              onClick={handleSelectDataClick}
            >
              Select Data
            </button>
          </div>
        )}
        {(!usingCustomBoundary || customBoundarySelected) && (
          <div className="record-list" id="reportForm" style={reportFormStyle}>
            <button
              className="close-report-button"
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                zIndex: 3000,
              }}
              onClick={handleCloseReport}
            >
              ×
            </button>

            <label
              style={{
                display: "block",
                marginBottom: "10px",
                pointerEvents: "auto",
                color: BndryLabelColor,
                fontWeight: BndryLabelFontWeight,
              }}
            >
              Please select your boundary type:
            </label>
            <select
              value={boundaryType}
              onChange={onBoundaryTypeChange}
              style={dropdownStyle}
            >
              <option value="">Select a boundary type</option>
              <option value="Custom">I want to use a custom boundary</option>
              <option value="City">City</option>
              <option value="Countywide Statistical Area (CSA)">
                Countywide Statistical Area (CSA)
              </option>
              <option value="Census Tract">Census Tract</option>
              <option value="LA City Council Districts">
                LA City Council Districts
              </option>
              <option value="Neighborhood">Neighborhood</option>
              <option value="Service Planning Area (SPA)">
                Service Planning Area (SPA)
              </option>
              <option value="Supervisor District">Supervisor District</option>
            </select>

            {!customBoundarySelected && (
              <>
                <label
                  style={{
                    display: "block",
                    marginTop: "20px",
                    marginBottom: "10px",
                    color: SelLabelColor,
                    fontWeight: SelLabelFontWeight,
                  }}
                >
                  Please choose your boundary:
                </label>
                <select
                  value={selectedRecordIndex}
                  onChange={(e) => {
                    handleDropdownChange(
                      e,
                      boundaryType,
                      {
                        neighborhoodList,
                        cityList,
                        censusTractList,
                        cityCouncilDistrictsList,
                        servicePlanningAreaList,
                        supervisorDistrictList,
                        CSAList,
                      },
                      setSelectedRecordIndex,
                      setSelectedRecord
                    );

                    setSelLabelColor(selectedRecordIndex ? "black" : "red");
                    setSelLabelFontWeight(
                      selectedRecordIndex ? "normal" : "bold"
                    );
                  }}
                  style={dropdownStyle}
                >
                  <option value="" disabled selected>
                    {isFetchingData
                      ? `Loading${".".repeat(loadingDots)}`
                      : "Select a record"}
                  </option>

                  {boundaryType === "Neighborhood" &&
                    neighborhoodList.map((record, i) => (
                      <option key={i} value={i}>
                        {record.attributes["name"] || "Unnamed"}
                      </option>
                    ))}

                  {boundaryType === "City" &&
                    cityList.map((record, i) => (
                      <option key={i} value={i}>
                        {record.attributes["CITY_NAME"] || "Unnamed"}
                      </option>
                    ))}

                  {boundaryType === "Countywide Statistical Area (CSA)" &&
                    CSAList.map((record, i) => (
                      <option key={i} value={i}>
                        {record.attributes["LABEL"] || "Unnamed"}
                      </option>
                    ))}

                  {boundaryType === "Census Tract" &&
                    censusTractList.map((record, i) => (
                      <option key={i} value={i}>
                        {record.attributes["CT20"] || "Unnamed"}
                      </option>
                    ))}

                  {boundaryType === "LA City Council Districts" &&
                    cityCouncilDistrictsList.map((record, i) => (
                      <option key={i} value={i}>
                        {record.attributes["NAME"] || "Unnamed"}
                      </option>
                    ))}

                  {boundaryType === "Service Planning Area (SPA)" &&
                    servicePlanningAreaList.map((record, i) => (
                      <option key={i} value={i}>
                        {record.attributes["SPA_NAME"] || "Unnamed"}
                      </option>
                    ))}

                  {boundaryType === "Supervisor District" &&
                    supervisorDistrictList.map((record, i) => (
                      <option key={i} value={i}>
                        {record.attributes["LABEL"] || "Unnamed"}
                      </option>
                    ))}
                </select>
              </>
            )}

            <label
              style={{
                display: "block",
                marginTop: "20px",
                marginBottom: "10px",
                color: DatLabelColor,
                fontWeight: DatLabelFontWeight,
              }}
            >
              Please choose your datasets:
            </label>

            <div
              style={{
                ...dropdownStyle,
                overflowY: "auto",
                maxHeight: "150px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                pointerEvents: "auto",
              }}
            >
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  style={{
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "auto",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDatasets.includes(dataset.id)}
                    onChange={() => {
                      handleDatasetChange(dataset.id);
                      setDatLabelColor("black");
                      setDatLabelFontWeight("normal");
                    }}
                    style={{ marginRight: "8px", pointerEvents: "auto" }}
                  />
                  {dataset.name}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "20px",
                pointerEvents: "auto",
              }}
            >
              <button
                style={
                  isHovered
                    ? {
                        ...viewReportButtonStyle,
                        ...viewReportButtonHoverStyle,
                      }
                    : viewReportButtonStyle
                }
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                // if there is no boundary selected set the label and font color to red
                onClick={() => {
                  if (!boundaryType) {
                    setBndryLabelColor("red");
                    setBndryLabelFontWeight("bold");
                  }
                  if (!customBoundarySelected && !selectedRecordIndex) {
                    setSelLabelColor("red");
                    setSelLabelFontWeight("bold");
                  }
                  if (selectedDatasets.length === 0) {
                    setDatLabelColor("red");
                    setDatLabelFontWeight("bold");
                  }

                  if (
                    boundaryType &&
                    (selectedRecordIndex || customBoundarySelected) &&
                    selectedDatasets.length > 0
                  ) {
                    handleReportClick();
                  }
                }}
              >
                View Report
              </button>
            </div>
          </div>
        )}

        {showPDFPane && (
          <div
            className="pdf-pane"
            style={{
              position: "fixed",
              top: "12.5%",
              left: "25%",
              width: "50%",
              height: "75%",
              zIndex: 5000,
              backgroundColor: "white",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              border: "1px solid black",
              pointerEvents: "auto",
            }}
          >
            {isLoadingReport ? (
              // Loading UI
              <div
                className="loading-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <div className="spinner"></div>
                <p>Loading Report...</p>
              </div>
            ) : (
              // PDF Display
              <>
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pointerEvents: "auto",
                  }}
                >
                  <button
                    onClick={() => setShowPDFPane(false)}
                    style={
                      isHoveredReport
                        ? {
                            ...customPdfCloseButton,
                            ...customPdfCloseButtonHover,
                          }
                        : customPdfCloseButton
                    }
                    onMouseEnter={() => setIsHoveredReport(true)}
                    onMouseLeave={() => setIsHoveredReport(false)}
                  >
                    Close
                  </button>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    overflow: "none",
                    pointerEvents: "auto",
                  }}
                >
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
    const w = "1=1";
    return {
      where: w,
      outFields: ["*"],
      returnGeometry: true,
      pageSize: 10,
    };
  };

  React.useEffect(() => {
    return () => {
      if (mapViewRef.current) {
        mapViewRef.current.destroy();
      }
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (mapViewRef2.current) {
        mapViewRef2.current.destroy();
      }
    };
  }, []);

  return (
    <div
      className="widget-use-feature-layer"
      style={{
        width: "100%",
        height: "100%",
        maxHeight: "800px",
        overflow: "auto",
      }}
    >
      <DataSourceComponent
        useDataSource={props.useDataSources[0]}
        query={getQuery()}
        widgetId={props.id}
        queryCount
      >
        {dataRender}
      </DataSourceComponent>
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds[0]}
        onActiveViewChange={onActiveViewChange}
      />
    </div>
  );
}
