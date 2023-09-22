import { React, AllWidgetProps } from 'jimu-core';
import { CSSProperties } from 'react';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import watchUtils from '@arcgis/core/core/watchUtils';
import './widgetStyles.css';

const paneStyle: CSSProperties = {
  position: 'absolute',
  top: '-2000%',
  left: '30%',
  width: '40%',
  height: '50%',
  backgroundColor: 'white',
  border: '1px solid black'
};

export default function Widget(props: AllWidgetProps<{}>) {
  const mapViewRef = React.useRef<HTMLDivElement>(null);
  const mapViewInstanceRef = React.useRef<MapView>(null);

  const initializeMap = () => {
    if (!mapViewRef.current) return;

    const webmap = new WebMap({
      basemap: "topo-vector"
    });

    const mapView = new MapView({
      container: mapViewRef.current,
      map: webmap
    });

    const layer = new FeatureLayer({
      portalItem: {
        id: '7582bdc207494ed2a2f6c19d1777b415'
      }
    });
    webmap.add(layer);

    mapViewInstanceRef.current = mapView;

    // Wait for the view and all layers to finish loading
    mapView.when().then(() => {



      const allLayersLoaded = webmap.layers.every(layer => layer.loaded);
      if (allLayersLoaded) {
        setTimeout(() => {
          handleScreenshot();
        }, 3000);
      } else {
        setTimeout(() => {
          // If not all layers are loaded, then wait for them to load
          const layerLoadEvents = webmap.layers.map(layer => layer.when());
          Promise.all(layerLoadEvents).then(() => {
            handleScreenshot();
          });
        }, 3000);
      }

    });
  };


  React.useEffect(() => {
    initializeMap();

    // Cleanup function
    return () => {
      if (mapViewInstanceRef.current) {
        mapViewInstanceRef.current.destroy();
        mapViewInstanceRef.current = null;
      }
    };
  }, []);

  const handleScreenshot = () => {
    if (mapViewInstanceRef.current) {
      const screenshotArea = {
        x: 0,
        y: 0,
        width: mapViewRef.current.clientWidth * 0.8,
        height: mapViewRef.current.clientHeight * 0.8
      };

      mapViewInstanceRef.current.takeScreenshot({ format: 'png', area: screenshotArea })
        .then(function (screenshot) {
          const a = document.createElement('a');
          a.href = screenshot.dataUrl;
          a.download = 'screenshot.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        })
        .catch((error) => {
          console.error("Screenshot error: ", error);
        });
    }
  };

  return (
    <div style={paneStyle} ref={mapViewRef}>
      <button onClick={handleScreenshot}>Take Screenshot</button>
    </div>
  );
}
