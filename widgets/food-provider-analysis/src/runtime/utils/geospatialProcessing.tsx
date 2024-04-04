// reportGenerationLogic.tsx

import type { SetStateAction, Dispatch } from 'react';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import type { Geometry } from "@arcgis/core/geometry";

// Define the createMask function which creates and returns a mask Graphic
export const createMask = async (mapView, geometry) => {
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

// Define the type for your setGlobalLegendData function if needed
type SetGlobalLegendDataType = Dispatch<SetStateAction<Record<string, any>>>;

export const filterPointsWithinPolygon = async (
    record,
    datasetId,
    layerViews,
    mapViewRef,
    setGlobalLegendData: SetGlobalLegendDataType // This is your callback function
): Promise<void> => {
    // Function implementation
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

                                setGlobalLegendData(prevData => {
                                    const newData = { ...prevData }; // Clone the previous state to ensure immutability
                                    const legendDataForCurrentDataset = featureLayerRenderer.classBreakInfos.map(info => {
                                        const symbol = info.symbol.clone();

                                        // Find the CIMSolidFill layer to access the color array
                                        const fillLayer = symbol.data.symbol.symbolLayers.find(layer => layer.type === 'CIMSolidFill');
                                        if (fillLayer && fillLayer.color) {
                                            const [r, g, b, a] = fillLayer.color; // Extract RGBA values
                                            // Convert the RGBA array into a CSS-friendly color string
                                            const rgbaColor = `rgba(${r}, ${g}, ${b}, ${a / 255})`; // Adjust alpha to 0-1 scale if necessary
                                            return {
                                                label: info.label,
                                                color: rgbaColor,
                                            };
                                        } else {
                                            // Fallback color if the expected structure is not found
                                            return {
                                                label: info.label,
                                                color: 'rgba(0, 0, 0, 1)', // Default to black or any suitable default
                                            };
                                        }
                                    });

                                    newData[datasetId] = legendDataForCurrentDataset;
                                    return newData; // Return the new state
                                });


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

export const getPointsInsideFeature = async (
    datasetId,
    layerViews // Adjust this type based on your actual layerViews structure
): Promise<number> => {
    const currentLayerView = layerViews[datasetId];
    if (!currentLayerView.layer) {
        console.error(`No layer view found for dataset ID: ${datasetId}`);
        return 0;
    }

    try {
        console.log("Querying features for dataset ID:", datasetId);
        console.log("Current layer view:", currentLayerView);

        const query = currentLayerView.layer.createQuery();
        query.geometry = currentLayerView.filter.geometry; // Make sure this is the correct way to access geometry
        query.spatialRelationship = "intersects";

        const result = await currentLayerView.layer.queryFeatures(query);
        console.log(`Points inside feature count for dataset ${datasetId}:`, result.features.length);
        return result.features.length;
    } catch (error) {
        console.error(`Error querying features for dataset ID: ${datasetId}`, error);
        return 0;
    }
};


