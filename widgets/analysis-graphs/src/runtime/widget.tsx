import { React } from 'jimu-core';
import { CSSProperties } from 'react';
import './widgetStyles.css';

const { useRef, useState } = React;

// Import your images here assuming that your project setup supports importing images
import restaurantsImage from './RestaurantsGraph.png';
import foodRetailMarketsImage from './FoodRetailMarketsGraph.png';

const FeatureTableWidget = () => {
    const [isPaneVisible, setIsPaneVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState('restaurants');
    const [imageSrc, setImageSrc] = useState(restaurantsImage); // Use the imported images as the initial state

    // Update the image when the radio button selection changes
    const handleRadioButtonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOption(event.target.value);
        setImageSrc(event.target.value === 'restaurants' ? restaurantsImage : foodRetailMarketsImage);
    };

    // Toggle the visibility of the pane
    const togglePane = () => {
        setIsPaneVisible(!isPaneVisible);
    };

    // Styles for the pane that shows the image
    const imagePaneStyle: CSSProperties = {
        width: '100%',
        height: '500px', // Make sure this height is enough for your image.
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: 'contain', // This will fit the entire image into the container.
        backgroundRepeat: 'no-repeat', // This will prevent the image from repeating.
        backgroundPosition: 'top center', // This will align the top of the image with the top of the container.
        display: isPaneVisible ? 'block' : 'none',
        position: 'absolute',
        left: '-48px',
        top: '169px',
    };

    // Styles for the radio buttons container
    const radioButtonsStyle: CSSProperties = {
        display: isPaneVisible ? 'flex' : 'none', // Only show if isPaneVisible is true
        flexDirection: 'row',
        justifyContent: 'space-between', // This will space out the child elements evenly
        alignItems: 'center',
        padding: '10px',
        top: '130px',
        position: 'absolute',
        backgroundColor: 'white',
        border: '1px solid black',
        left: '47px',
        width: '310px',
    };

    const radioButtonStyle: CSSProperties = {
        marginRight: '10px', // Set the margin-right to 10px
    };

    // New style for labels to add padding to the radio button
    const labelStyle: CSSProperties = {
        marginRight: '10px', // This adds space between the labels if flexDirection is 'row'
        display: 'flex',
        alignItems: 'center', // This ensures that the radio button and label text are aligned
        padding: '0 10px 0 0', // This adds padding to the right side of the radio button
    };

    // Styles for the widget button
    const widgetButtonStyle: CSSProperties = {
        position: 'absolute',
        top: '131px',
        left: '15px',
        zIndex: 2000,
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px 0px',
        pointerEvents: 'auto',
    };

    return (
        <div>
            <div style={widgetButtonStyle}>
                <button
                    className="esri-widget--button border-0 select-tool-btn d-flex align-items-center justify-content-center"
                    onClick={togglePane}
                >
                    <span className="esri-icon esri-icon-line-chart"></span>
                </button>
            </div>
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

            <div style={imagePaneStyle}></div>
        </div>
    );
}

export default FeatureTableWidget;
