import { React } from 'jimu-core';
import { CSSProperties } from 'react';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import { loadArcGISJSAPIModules } from 'jimu-arcgis';
import './widgetStyles.css';

const { useState, useEffect, useRef } = React;

const BufferAnalysis = (props) => {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [jimuMapView, setJimuMapView] = useState(null);
    const [mapInteractionEnabled, setMapInteractionEnabled] = useState(false);
    const [existingPointGraphic, setExistingPointGraphic] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const mapWidgetId = props.useMapWidgetIds?.[0].split('-')[0];

    // Styles for the dropdown
    const dropdownStyle: CSSProperties = {
        display: dropdownVisible ? 'block' : 'none',
        position: 'absolute',
        top: '257px',
        left: '45px',
        zIndex: 2000,
        backgroundColor: '#f0f0f0',
        padding: '10px',
        pointerEvents: 'all',
        width: '300px'
    };

    // Styles for the widget button
    const widgetButtonStyle: CSSProperties = {
        position: 'absolute',
        top: '257px',
        left: '15px',
        zIndex: 2000,
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px 0px',
        pointerEvents: 'all',
    };

    // Styles for form buttons
    const formButtonStyle: CSSProperties = {
        width: '100%',
        backgroundColor: 'white',
        marginBottom: '10px'
    };

    // Style for the banner
    const bannerStyle: CSSProperties = {
        display: showBanner ? 'block' : 'none',
        position: 'fixed',
        bottom: '100px',
        left: '49%',
        transform: 'translateX(-50%)',
        backgroundColor: '#f8f8f8',
        padding: '10px 20px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 3000,
        width: '29.9%'
    };

    // Style for the input form
    const inputFormStyle: CSSProperties = {
        display: showInput ? 'block' : 'none',
        marginTop: '10px'
    };

    const inputTextStyle: CSSProperties = {
        marginRight: '5px',
        padding: '5px',
        width: '80%',
        marginBottom: '10px'
    };

    // Set up the graphics layer and map click handler
    useEffect(() => {
        if (!jimuMapView) return;

        // Map click handler
        const clickHandler = jimuMapView.view.on('click', (event) => {
            if (mapInteractionEnabled) {
                addOrUpdateGraphic(event.mapPoint);
            }
        });

        return () => clickHandler.remove();
    }, [jimuMapView, mapInteractionEnabled, existingPointGraphic]);

    const addOrUpdateGraphic = (mapPoint) => {
        loadArcGISJSAPIModules(['esri/Graphic', 'esri/geometry/Point', 'esri/symbols/SimpleMarkerSymbol'])
            .then(([Graphic, Point, SimpleMarkerSymbol]) => {
                if (existingPointGraphic) {
                    // Update the existing graphic's location
                    existingPointGraphic.geometry = mapPoint;
                    existingPointGraphic.symbol = new SimpleMarkerSymbol({
                        color: [226, 119, 40],
                        outline: { color: [255, 255, 255], width: 2 }
                    });
                } else {
                    // Create a new graphic
                    const point = new Point({
                        longitude: mapPoint.longitude,
                        latitude: mapPoint.latitude
                    });

                    const simpleMarkerSymbol = new SimpleMarkerSymbol({
                        color: [226, 119, 40],
                        outline: { color: [255, 255, 255], width: 2 }
                    });

                    const pointGraphic = new Graphic({
                        geometry: point,
                        symbol: simpleMarkerSymbol
                    });

                    jimuMapView.view.graphics.add(pointGraphic);
                    setExistingPointGraphic(pointGraphic);
                }
                setShowInput(true);
            })
            .catch(err => console.error(err));
    };

    const handleInputChange = (event) => {
        // Allow only numbers (including floats)
        setInputValue(event.target.value);
    };

    // Handlers
    const onMapViewReady = (jmv) => {
        if (jmv && jmv.view) {
            setJimuMapView(jmv);
        }
    };

    const onSelectLocationClick = () => {
        setMapInteractionEnabled(true);
        setShowBanner(true);
    };

    return (
        <div>
            <div style={bannerStyle}>
                <b>Please click on the map where you would like the centroid of your analysis to be.
                    If you want a different point, click somewhere else and your original point will move.</b>
            </div>
            <div style={widgetButtonStyle}>
                <button
                    className="esri-widget--button border-0 select-tool-btn d-flex align-items-center justify-content-center"
                    onClick={() => setDropdownVisible(!dropdownVisible)}
                >
                    <span className="esri-icon esri-icon-documentation"></span>
                </button>
            </div>
            <div style={dropdownStyle}>
                <button
                    className="esri-widget esri-widget--button"
                    style={formButtonStyle}
                    onClick={onSelectLocationClick}
                >
                    Select a Location
                </button>
                <div style={inputFormStyle}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Enter buffer distance here:
                    </label>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        style={inputTextStyle}
                    />
                    <label>Miles</label>
                </div>
                <button
                    className="esri-widget esri-widget--button"
                    style={formButtonStyle}
                >
                    View Analysis
                </button>
            </div>
            <JimuMapViewComponent
                useMapWidgetId={mapWidgetId}
                onActiveViewChange={onMapViewReady}
            />
        </div>
    );
};

export default BufferAnalysis;