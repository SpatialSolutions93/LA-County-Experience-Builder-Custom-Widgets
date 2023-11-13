import { React } from 'jimu-core';
import { CSSProperties } from 'react';
import './widgetStyles.css';

const { useRef, useState } = React;

// Import your images here assuming that your project setup supports importing images
import restaurantsImage_Count from './RestaurantsGraph_County.png';
import foodRetailMarketsImage_Count from './FoodRetailMarketsGraph_County.png';
import restaurantsImage_Neigh from './RestaurantsGraph_Neigh.png';
import foodRetailMarketsImage_Neigh from './FoodRetailMarketsGraph_Neigh.png';

const FeatureTableWidget = () => {
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedOption, setSelectedOption] = useState('restaurants');
    const [imageSrc, setImageSrc] = useState(restaurantsImage_Count);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [viewGraphsVisible, setViewGraphsVisible] = useState(false);

    // Update the image when the radio button selection changes
    const handleRadioButtonChange = (event) => {
        setSelectedOption(event.target.value);
        if (selectedLocation === 'LA County') {
            setImageSrc(event.target.value === 'restaurants' ? restaurantsImage_Count : foodRetailMarketsImage_Count);
        } else if (selectedLocation === 'El Sereno') {
            setImageSrc(event.target.value === 'restaurants' ? restaurantsImage_Neigh : foodRetailMarketsImage_Neigh);
        }
    };

    // Update the image when the dropdown selection changes
    const handleDropdownChange = (event) => {
        setSelectedLocation(event.target.value);
    };

    // Handle the "View Graphs" button click
    const handleViewGraphsClick = () => {
        if (selectedLocation) {
            setDropdownVisible(false); // Hide the dropdown
            // Set the initial image based on the location
            setImageSrc(selectedOption === 'restaurants' ?
                (selectedLocation === 'LA County' ? restaurantsImage_Count : restaurantsImage_Neigh) :
                (selectedLocation === 'LA County' ? foodRetailMarketsImage_Count : foodRetailMarketsImage_Neigh));
            setViewGraphsVisible(true); // Show the graphs and radio buttons
        }
    };

    // Styles for the dropdown
    const dropdownStyle: CSSProperties = {
        display: dropdownVisible ? 'block' : 'none',
        position: 'absolute',
        top: '131px',
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
        top: '131px',
        left: '17px',
        zIndex: 2000,
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px 0px',
        pointerEvents: 'all',
    };

    // Styles for the pane that shows the image
    const imagePaneStyle: CSSProperties = {
        width: '100%',
        height: '500px',
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',
        display: viewGraphsVisible ? 'block' : 'none',
        position: 'absolute',
        left: '-30px',
        top: '169px',
        pointerEvents: 'all',
    };

    // Styles for the radio buttons container
    const radioButtonsStyle: CSSProperties = {
        display: viewGraphsVisible ? 'flex' : 'none',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        top: '130px',
        position: 'absolute',
        backgroundColor: 'white',
        border: '1px solid black',
        left: '49px',
        width: '310px',
        pointerEvents: 'all',
    };

    // Style for labels to add padding to the radio button
    const labelStyle: CSSProperties = {
        marginRight: '10px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px 0 0',
        pointerEvents: 'all',
    };

    // Style for the radio button
    const radioButtonStyle: CSSProperties = {
        marginRight: '10px',
        pointerEvents: 'all',
    };

    // Add this function to handle the close button click
    const handleCloseButtonClick = () => {
        setViewGraphsVisible(false);
    };

    return (
        <div>
            <div style={widgetButtonStyle}>
                <button
                    className="esri-widget--button border-0 select-tool-btn d-flex align-items-center justify-content-center"
                    onClick={() => setDropdownVisible(!dropdownVisible)}
                >
                    <span className="esri-icon esri-icon-line-chart"></span>
                </button>
            </div>
            <div style={dropdownStyle}>
                <select onChange={handleDropdownChange} style={{ width: '100%', marginBottom: '10px' }}>
                    <option value="">Select a location</option>
                    <option value="LA County">LA County</option>
                    <option value="El Sereno">El Sereno</option>
                </select>
                <button
                    className="esri-widget esri-widget--button"
                    onClick={handleViewGraphsClick}
                    style={{ width: '100%', backgroundColor: 'white' }}
                >
                    View Graphs
                </button>
            </div>
            {viewGraphsVisible && (
                <>
                    <div style={radioButtonsStyle}>
                        <label style={labelStyle}>
                            <input
                                type="radio"
                                value="restaurants"
                                checked={selectedOption === 'restaurants'}
                                onChange={handleRadioButtonChange}
                                style={radioButtonStyle}
                            />
                            Restaurants
                        </label>
                        <label style={labelStyle}>
                            <input
                                type="radio"
                                value="food_retail_markets"
                                checked={selectedOption === 'food_retail_markets'}
                                onChange={handleRadioButtonChange}
                                style={radioButtonStyle}
                            />
                            Food Retail Markets
                        </label>
                    </div>
                    <div style={imagePaneStyle}>
                        <span
                            className="close-button"
                            onClick={handleCloseButtonClick}
                        >
                            &#x2715; {/* This is the X symbol */}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};

export default FeatureTableWidget;
