import { React } from 'jimu-core';
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import { CSSProperties } from 'react';
import './widgetStyles.css';

const { useRef, useState } = React;

const FeatureTableWidget = () => {
    const tableContainerRef = useRef(null);
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [isTableVisible, setIsTableVisible] = useState(false);
    const [isFeatureTableContainerVisible, setIsFeatureTableContainerVisible] = useState(false);

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
            id: 'a302cf868b08407cb2f287d9ee10ef76'
        },
        definitionExpression: "PE_DESCRIPTION LIKE '%RESTAURANT%'"
    }));

    const [retailFoodMarkets] = useState(new FeatureLayer({
        portalItem: {
            id: 'a302cf868b08407cb2f287d9ee10ef76'
        },
        definitionExpression: "PE_DESCRIPTION LIKE '%FOOD MKT RETAIL%'"
    }));

    const [supermarketsAndGroceryStores] = useState(new FeatureLayer({
        portalItem: {
            id: '3796521d25ec4089ae17904f365c0178'
        }
    }));

    const [wicFoodRetailer] = useState(new FeatureLayer({
        portalItem: {
            id: '02acd30ed2264509bb0bb8bf6c14b8eb'
        }
    }));

    const datasets = [
        { id: 1, name: "CalFresh Food Retailers", dataSource: calFreshFoodRetailer },
        { id: 2, name: "CalFresh Restaurants", dataSource: calFreshRestaurant },
        { id: 3, name: "Community Gardens", dataSource: communityGardens },
        { id: 4, name: "EBT Stores and Markets", dataSource: ebtStoresAndMarkets },
        { id: 5, name: "Farmer's Markets", dataSource: farmersMarkets },
        { id: 6, name: "Food Pantries", dataSource: foodPantry },
        { id: 7, name: "Parks", dataSource: parks },
        { id: 8, name: "Parks and Gardens", dataSource: parksAndGardens },
        { id: 9, name: "Public Elementary Schools", dataSource: publicElementarySchools },
        { id: 10, name: "Public High Schools", dataSource: publicHighSchools },
        { id: 11, name: "Public Middle Schools", dataSource: publicMiddleSchools },
        { id: 12, name: "Restaurants", dataSource: restaurants },
        { id: 13, name: "Retail Food Markets", dataSource: retailFoodMarkets },
        //{ id: 14, name: "Supermarkets and Grocery Stores (Unavailable)", dataSource: supermarketsAndGroceryStores },
        { id: 15, name: "WIC Food Retailers", dataSource: wicFoodRetailer },
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
        top: '131px',
        left: '15px',
        zIndex: 2000,
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px 0px',
        pointerEvents: 'all'
    };

    const dropdownStyle: CSSProperties = {
        position: 'absolute',
        top: '131px',
        left: '45px',
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
    );
}

export default FeatureTableWidget;