import Graphic from "@arcgis/core/Graphic";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import serviceArea from "@arcgis/core/rest/serviceArea";
import ServiceAreaParameters from "@arcgis/core/rest/support/ServiceAreaParameters";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import esriConfig from "@arcgis/core/config";
import { JimuMapView } from "jimu-arcgis";

// UPDATE UPDATE USE THIS FOR DEPLOYMENT, SETUP ENV VARIABLES

/*   useEffect(() => {
    const clientId = process.env.REACT_APP_ARCGIS_CLIENT_ID;

    if (!clientId) {
      console.error("Client ID is not defined in the environment variables.");
      return;
    }

    // OAuth setup
    const info = new OAuthInfo({
      appId: clientId,
      popup: false, // Display a pop-up window for OAuth sign-in. Set to true if you want a popup.
    });
    IdentityManager.registerOAuthInfos([info]);

    IdentityManager.checkSignInStatus(info.portalUrl + "/sharing")
      .then((credential) => {
        setAccessToken(credential.token);
      })
      .catch(() => {
        IdentityManager.getCredential(info.portalUrl + "/sharing").then(
          (credential) => {
            setAccessToken(credential.token);
          }
        );
      });
  }, []); 
   function createServiceArea(point, view) {
    if (!accessToken) {
      console.error("Access token is not available");
      return;
    }

    let markerSymbol = {
      type: "simple-marker",
      color: [255, 255, 255], // White marker
      size: 8,
    };
    const locationGraphic = new Graphic({
      geometry: point,
      symbol: markerSymbol,
    });

    const driveTimeCutoffs = [10]; // Minutes

    const serviceAreaParams = new ServiceAreaParameters({
      facilities: new FeatureSet({
        features: [locationGraphic],
      }),
      defaultBreaks: driveTimeCutoffs,
      outSpatialReference: view.spatialReference,
      trimOuterPolygon: true,
    });

    const serviceAreaUrl =
      "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea";

    // Temporarily override the token in esriConfig for this request
    esriConfig.request.interceptors.push({
      urls: serviceAreaUrl,
      before: function (params) {
        params.requestOptions.query.token = accessToken;
        return params;
      },
      after: function () {
        esriConfig.request.interceptors.pop();
      },
    });

    serviceArea
      .solve(serviceAreaUrl, serviceAreaParams)
      .then((result) => {
        view.graphics.removeAll();
        result.serviceAreaPolygons.features.forEach((feature) => {
          const fillSymbol = new SimpleFillSymbol({
            color: [255, 50, 50, 0.25], // Semi-transparent red
            style: "solid",
            outline: {
              color: [255, 0, 0, 0.8], // Red outline
              width: 2,
            },
          });

          feature.symbol = fillSymbol;
          view.graphics.add(feature);
          setLastGraphicGeometry(feature.geometry);
        });
      })
      .catch((error) => {
        console.error("Service Area calculation failed: ", error);
      });
  } */ // UPDATE UPDATE USE THIS FOR DEPLOYMENT, SETUP ENV VARIABLES

export const createServiceArea = (point, view, accessToken) => {
  if (!accessToken) {
    console.error("Access token is not available");
    return;
  }

  esriConfig.apiKey =
    "3NKHt6i2urmWtqOuugvr9TZlSOGrCkqK87RC8a3UuXn8POT-aNCngKIQwTo_9xedN6OzUbaVdxUSLIyBbDnVdwtY818dP8YnuNhyok11op-TjHqAjC7_1rJnfdCp7w21"; // UPDATE UPDATE REMOVE TEMP KEY AND AUTO CLIENT METHOD

  let markerSymbol = {
    type: "simple-marker",
    color: [255, 255, 255], // White marker
    size: 8,
  };
  const locationGraphic = new Graphic({
    geometry: point,
    symbol: markerSymbol,
  });

  const serviceAreaParams = new ServiceAreaParameters({
    facilities: new FeatureSet({
      features: [locationGraphic],
    }),
    defaultBreaks: [10],
    outSpatialReference: view.spatialReference,
    trimOuterPolygon: true,
  });

  const serviceAreaUrl =
    "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea";

  serviceArea
    .solve(serviceAreaUrl, serviceAreaParams)
    .then((result) => {
      view.graphics.removeAll();
      result.serviceAreaPolygons.features.forEach((feature) => {
        const fillSymbol = new SimpleFillSymbol({
          color: [255, 50, 50, 0.25],
          style: "solid",
          outline: {
            color: [255, 0, 0, 0.8],
            width: 2,
          },
        });

        feature.symbol = fillSymbol;
        view.graphics.add(feature);
      });
    })
    .catch((error) => {
      console.error("Service Area calculation failed: ", error);
    });
};
