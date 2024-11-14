import type { SetStateAction, Dispatch } from "react";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import type { Geometry } from "@arcgis/core/geometry";

// Define the createMask function which creates and returns a mask Graphic
export const createMask = async (mapView, geometryToUse) => {
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
        [-20037508.3427892, -20037508.3427892],
      ],
    ],
    spatialReference: mapView.spatialReference,
  });

  // Subtract the feature's geometry from the big polygon to get the mask
  const mask = geometryEngine.difference(bigPolygon, geometryToUse) as Polygon;

  const symbol = new SimpleFillSymbol({
    color: [0, 0, 0, 0],
    outline: {
      color: [0, 0, 0, 0],
      width: 0,
    },
  });

  // Create a graphic for the mask
  const maskGraphic = new Graphic({
    geometry: mask,
    symbol: symbol,
  });

  // Clear previous mask graphics and add the new mask to the GraphicsLayer
  maskLayer.graphics.removeAll();
  maskLayer.graphics.add(maskGraphic);
};

// Define the type for your setGlobalLegendData function if needed
type SetGlobalLegendDataType = Dispatch<SetStateAction<Record<string, any>>>;
type setGlobalSymbolType = Dispatch<SetStateAction<Record<string, any>>>;

export const filterPointsWithinPolygon = async (
  datasetId,
  layerViews,
  mapViewRef,
  geometryToUse,
  setGlobalLegendData: SetGlobalLegendDataType, // This is your callback function
  setGlobalSymbol: setGlobalSymbolType
): Promise<void> => {
  // Print layerviews
  const currentLayerView = layerViews[datasetId];
  if (!currentLayerView) {
    console.error(`No layer view found for dataset ID: ${datasetId}`);
    return;
  }

  // Check the geometry type of the layer
  const geometryType = currentLayerView.layer.geometryType;

  if (geometryType === "polygon") {
    const featureLayer = currentLayerView.layer;

    // Retrieve the renderer from the feature layer
    const featureLayerRenderer = featureLayer.renderer;

    const query = featureLayer.createQuery();
    query.geometry = geometryToUse;
    query.spatialRelationship = "intersects";

    const defaultSymbol = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: "lightgray", // any light color to ensure visibility on the map
      style: "solid",
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: "darkgray",
        width: 1,
      },
    };

    try {
      const features = await featureLayer.queryFeatures(query);
      if (features.features.length > 0) {
        const intersectedFeatures = features.features
          .map((feature) => {
            if (feature.geometry) {
              const intersectedGeometry = geometryEngine.intersect(
                feature.geometry,
                geometryToUse
              ) as Geometry;
              if (intersectedGeometry) {
                // For ClassBreaksRenderer, find the correct symbol based on the feature's attribute
                let symbol;
                if (featureLayerRenderer.type === "class-breaks") {
                  const attributeValue =
                    feature.attributes[featureLayerRenderer.field];
                  for (let cb of featureLayerRenderer.classBreakInfos) {
                    if (
                      attributeValue >= cb.minValue &&
                      attributeValue < cb.maxValue
                    ) {
                      symbol = cb.symbol.clone();
                      break;
                    }
                  }

                  setGlobalSymbol((prevData) => {
                    const newData = { ...prevData };
                    newData[datasetId] = "class-breaks";
                    return newData;
                  });

                  setGlobalLegendData((prevData) => {
                    const newData = { ...prevData }; // Clone the previous state to ensure immutability
                    const legendDataForCurrentDataset =
                      featureLayerRenderer.classBreakInfos.map((info) => {
                        const symbol = info.symbol.clone();

                        // Find the CIMSolidFill layer to access the color array
                        const fillLayer = symbol.data.symbol.symbolLayers.find(
                          (layer) => layer.type === "CIMSolidFill"
                        );
                        if (fillLayer && fillLayer.color) {
                          const [r, g, b, a] = fillLayer.color; // Extract RGBA values
                          // Convert the RGBA array into a CSS-friendly color string
                          const rgbaColor = `rgba(${r}, ${g}, ${b}, ${
                            a / 255
                          })`; // Adjust alpha to 0-1 scale if necessary
                          return {
                            label: info.label,
                            color: rgbaColor,
                          };
                        } else {
                          // Fallback color if the expected structure is not found
                          return {
                            label: info.label,
                            color: "rgba(0, 0, 0, 1)", // Default to black or any suitable default
                          };
                        }
                      });

                    newData[datasetId] = legendDataForCurrentDataset;
                    return newData; // Return the new state
                  });
                } else if (featureLayerRenderer.type === "unique-value") {
                  const attributeValue =
                    feature.attributes[featureLayerRenderer.field];
                  if (featureLayerRenderer.type === "unique-value") {
                    // Assume attributeValue holds the value for the field used by the unique-value renderer
                    const attributeValue =
                      feature.attributes[featureLayerRenderer.field];

                    // Find the matching unique value info
                    let matchingInfo =
                      featureLayerRenderer.uniqueValueInfos.find(
                        (info) => info.value === attributeValue
                      );

                    if (matchingInfo && matchingInfo.symbol) {
                      // Clone the symbol from the matching unique value info
                      symbol = matchingInfo.symbol.clone();
                    } else {
                      // Use a default symbol if no match is found
                      symbol = defaultSymbol;
                    }
                  }

                  let matchingInfo = featureLayerRenderer.uniqueValueInfos.find(
                    (info) => info.value == attributeValue
                  );

                  if (matchingInfo && matchingInfo.symbol) {
                    setGlobalSymbol((prevData) => {
                      const newData = { ...prevData };
                      newData[datasetId] = "unique-value";
                      return newData;
                    });

                    setGlobalLegendData((prevData) => {
                      const newData = { ...prevData };
                      // Initialize an empty array to track unique outline colors
                      let uniqueOutlineColors = [];

                      const legendDataForCurrentDataset =
                        featureLayerRenderer.uniqueValueInfos.reduce(
                          (acc, info) => {
                            const symbol = info.symbol.clone();

                            const fillLayer =
                              symbol.data.symbol.symbolLayers.find(
                                (layer) => layer.type === "CIMSolidFill"
                              );
                            const strokeLayer =
                              symbol.data.symbol.symbolLayers.find(
                                (layer) => layer.type === "CIMSolidStroke"
                              );

                            if (
                              fillLayer &&
                              fillLayer.color &&
                              strokeLayer &&
                              strokeLayer.color
                            ) {
                              const [r, g, b, a] = fillLayer.color; // Extract RGBA values for fill color
                              const rgbaFillColor = `rgba(${r}, ${g}, ${b}, ${
                                a / 255
                              })`; // Adjust alpha to 0-1 scale if necessary

                              const [r2, g2, b2, a2] = strokeLayer.color; // Extract RGBA values for outline color
                              const rgbaOutlineColor = `rgba(${r2}, ${g2}, ${b2}, ${
                                a2 / 255
                              })`;

                              // Check if the outline color is already in the uniqueOutlineColors array
                              if (
                                !uniqueOutlineColors.includes(rgbaFillColor)
                              ) {
                                uniqueOutlineColors.push(rgbaFillColor); // Add new unique color to the list

                                // Include this item in the accumulator for the legend data
                                acc.push({
                                  label: info.label,
                                  fillColor: rgbaFillColor,
                                  outlineColor: rgbaOutlineColor,
                                  outlineWidth: strokeLayer.width, // Assuming `width` is directly on the stroke layer
                                });
                              }
                            }

                            return acc;
                          },
                          []
                        ); // Start with an empty array accumulator

                      newData[datasetId] = legendDataForCurrentDataset;

                      return newData;
                    });
                  }
                } else if (featureLayerRenderer.type === "simple") {
                  symbol = featureLayerRenderer.symbol.clone();
                }
                if (!symbol) {
                  symbol = defaultSymbol;
                }

                // Create the graphic with the symbol
                return new Graphic({
                  geometry: intersectedGeometry,
                  attributes: feature.attributes,
                  symbol: symbol, // Apply the symbol directly
                });
              }
            }
          })
          .filter((feature) => feature);

        const graphicsLayer = new GraphicsLayer({
          graphics: intersectedFeatures,
        });

        // After adding the intersected features to the map
        mapViewRef.current.map.add(graphicsLayer);

        mapViewRef.current.map.layers.remove(featureLayer);
      }
    } catch (error) {
      console.error("Failed to query or intersect features:", error);
    }
  } else if (geometryType === "point") {
    currentLayerView.filter = {
      geometry: geometryToUse,
      spatialRelationship: "intersects",
    };
  } else {
    console.error("Unsupported geometry type for filtering or clipping.");
  }
};
