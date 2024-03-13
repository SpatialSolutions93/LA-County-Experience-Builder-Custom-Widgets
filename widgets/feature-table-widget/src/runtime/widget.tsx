import { React } from 'jimu-core';
import WebMap from '@arcgis/core/WebMap';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import { CSSProperties } from 'react';
import Draggable from 'react-draggable';
import './widgetStyles.css';

const { useRef, useState, useEffect } = React;

const FeatureTableWidget = () => {
    const tableContainerRef = useRef(null);
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [isTableVisible, setIsTableVisible] = useState(false);
    const [isFeatureTableContainerVisible, setIsFeatureTableContainerVisible] = useState(false);
    const [farmersMarkets, setFarmersMarkets] = useState<FeatureLayer | null>(null);
    const [calFreshFoodRetailer, setCalFreshFoodRetailer] = useState<FeatureLayer | null>(null);
    const [calFreshRestaurant, setCalFreshRestaurant] = useState<FeatureLayer | null>(null);
    const [communityGardens, setCommunityGardens] = useState<FeatureLayer | null>(null);
    const [foodPantry, setFoodPantry] = useState<FeatureLayer | null>(null);
    const [parks, setParks] = useState<FeatureLayer | null>(null);
    const [parksAndGardens, setParksAndGardens] = useState<FeatureLayer | null>(null);
    const [publicElementarySchools, setPublicElementarySchools] = useState<FeatureLayer | null>(null);
    const [publicHighSchools, setPublicHighSchools] = useState<FeatureLayer | null>(null);
    const [publicMiddleSchools, setPublicMiddleSchools] = useState<FeatureLayer | null>(null);
    const [restaurants, setRestaurants] = useState<FeatureLayer | null>(null);
    const [retailFoodMarkets, setRetailFoodMarkets] = useState<FeatureLayer | null>(null);
    const [wicFoodRetailer, setWicFoodRetailer] = useState<FeatureLayer | null>(null);

    useEffect(() => {
        const LACountyWebMap = new WebMap({
            portalItem: {
                id: '2bc29891fc744b62b57de017897583e0'
            }
        });

        LACountyWebMap.load().then(() => {

            const schools = LACountyWebMap.layers.getItemAt(1) as GroupLayer;
            const greenAndGardenSpaces = LACountyWebMap.layers.getItemAt(2) as GroupLayer;
            const retailFoodOutlets = LACountyWebMap.layers.getItemAt(6) as GroupLayer;
            const foodAssistanceAndBenefits = LACountyWebMap.layers.getItemAt(7) as GroupLayer;
            const retailFoodMarkets_GroupLayer = retailFoodOutlets.layers.getItemAt(2) as GroupLayer;
            const restaurants_GroupLayer = retailFoodOutlets.layers.getItemAt(3) as GroupLayer;
            const farmersMarkets_loading = retailFoodOutlets.layers.getItemAt(0) as FeatureLayer;
            const calFreshFoodRetailer_loading = foodAssistanceAndBenefits.layers.getItemAt(3) as FeatureLayer;
            const calFreshRestaurant_loading = foodAssistanceAndBenefits.layers.getItemAt(2) as FeatureLayer;
            const communityGardens_loading = greenAndGardenSpaces.layers.getItemAt(2) as FeatureLayer;
            const foodPantry_loading = foodAssistanceAndBenefits.layers.getItemAt(0) as FeatureLayer;
            const parks_loading = greenAndGardenSpaces.layers.getItemAt(1) as FeatureLayer;
            const parksAndGardens_loading = greenAndGardenSpaces.layers.getItemAt(0) as FeatureLayer;
            const publicElementarySchools_loading = schools.layers.getItemAt(2) as FeatureLayer;
            const publicHighSchools_loading = schools.layers.getItemAt(0) as FeatureLayer;
            const publicMiddleSchools_loading = schools.layers.getItemAt(1) as FeatureLayer;
            const restaurants_loading = restaurants_GroupLayer.layers.getItemAt(2) as FeatureLayer;
            const retailFoodMarkets_loading = retailFoodMarkets_GroupLayer.layers.getItemAt(2) as FeatureLayer;
            const wicFoodRetailer_loading = foodAssistanceAndBenefits.layers.getItemAt(1) as FeatureLayer;

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
        }).catch(error => {
            console.error("Error loading WebMap: ", error);
        });
    }, []);

    const datasets = [
        { id: 1, name: "CalFresh Food Retailers", dataSource: calFreshFoodRetailer },
        { id: 2, name: "CalFresh Restaurants", dataSource: calFreshRestaurant },
        { id: 3, name: "Community Gardens", dataSource: communityGardens },
        { id: 4, name: "Farmer's Markets", dataSource: farmersMarkets },
        { id: 5, name: "Food Pantries", dataSource: foodPantry },
        { id: 6, name: "Parks", dataSource: parks },
        { id: 7, name: "Parks and Gardens", dataSource: parksAndGardens },
        { id: 8, name: "Public Elementary Schools", dataSource: publicElementarySchools },
        { id: 9, name: "Public High Schools", dataSource: publicHighSchools },
        { id: 10, name: "Public Middle Schools", dataSource: publicMiddleSchools },
        { id: 11, name: "Restaurants", dataSource: restaurants },
        { id: 12, name: "Retail Food Markets", dataSource: retailFoodMarkets },
        { id: 13, name: "WIC Food Retailers", dataSource: wicFoodRetailer },
    ];

    const handleBackButton = () => {
        setSelectedLayerId(null);
        setIsTableVisible(false);
        setIsFeatureTableContainerVisible(false); // Add this line
        if (tableContainerRef.current) {
            tableContainerRef.current.innerHTML = '';
        }
    };

    const handleViewTable = () => {
        const selectedDataset = datasets.find(dataset => dataset.id === selectedLayerId);
        if (selectedDataset && tableContainerRef.current) {
            // Wait for the next tick to ensure the container is rendered
            setTimeout(() => {
                const featureTable = new FeatureTable({
                    layer: selectedDataset.dataSource,
                    container: tableContainerRef.current
                });
                setIsFeatureTableContainerVisible(true);
            }, 0);
        }
    };

    const handleDropdownToggle = () => {
        const dropdown = document.getElementById("dropdownContainer");
        if (dropdown) {
            if (dropdown.style.visibility === "hidden" || dropdown.style.visibility === "") {
                dropdown.style.visibility = "visible";
            } else {
                dropdown.style.visibility = "hidden";
            }
        }
    }

    const reportButtonStyle: CSSProperties = {
        position: 'absolute',
        top: '173px',
        left: '15px',
        zIndex: 2000,
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px 0px',
        pointerEvents: 'all'
    };

    const dropdownStyle: CSSProperties = {
        position: 'absolute',
        top: '173px',
        left: '47px',
        zIndex: 2000,
        backgroundColor: '#f0f0f0',
        padding: '10px',
        visibility: 'hidden',
        pointerEvents: 'all',
        width: '300px'
    };

    const viewTableButtonStyle: CSSProperties = {
        width: '35%',
        backgroundColor: 'white',
        pointerEvents: 'all'
    }

    const closeButtonStyle: CSSProperties = {
        // your current styles for the button
        display: isFeatureTableContainerVisible ? 'block' : 'none',
        pointerEvents: 'all'
    };

    return (
        <div>
            <div style={reportButtonStyle}>
                <button
                    className="esri-widget--button border-0 select-tool-btn d-flex align-items-center justify-content-center"
                    onClick={handleDropdownToggle}
                >
                    <span className="esri-icon esri-icon-table"></span>
                </button>
            </div>
            <div id="dropdownContainer" style={dropdownStyle}>
                <select className="esri-widget" onChange={e => setSelectedLayerId(Number(e.target.value))} style={{ width: '100%', marginBottom: '10px' }}>
                    <option value="">Select a layer</option>
                    {datasets.map(dataset => (
                        <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                    ))}
                </select>
                <button style={viewTableButtonStyle} className="esri-widget esri-widget--button" onClick={handleViewTable}>View Table</button>
            </div>
            <Draggable>
                <div>
                    <div className="esri-feature-table__loader-container">
                        <button
                            className="esri-icon esri-icon-close" // Change the class to the close icon
                            onClick={handleBackButton}
                            style={closeButtonStyle}
                        ></button>
                    </div>
                    <div
                        ref={tableContainerRef}
                        style={{
                            width: '100%',
                            height: '500px',
                            display: isFeatureTableContainerVisible ? 'flex' : 'none' // Control visibility here
                        }}
                    ></div>
                </div>
            </Draggable>
        </div>
    );
}

export default FeatureTableWidget;