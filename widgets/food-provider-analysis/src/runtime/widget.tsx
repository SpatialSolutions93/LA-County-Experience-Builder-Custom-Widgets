import { React, DataSourceManager, DataSourceStatus, DataSourceComponent } from 'jimu-core';
import type { IMDataSourceInfo, DataSource, FeatureLayerQueryParams, AllWidgetProps } from 'jimu-core';
import { Document, Page } from 'react-pdf';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const { useRef, useState } = React;

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export default function Widget(props: AllWidgetProps<unknown>) {
  const dsRef = useRef(null);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleDropdownChange = (event) => {
    const selectedIndex = event.target.value;
    const record = records[selectedIndex];
    setSelectedRecord(record);
    console.log("Selected Feature's Geometry:", record.feature.geometry);
    console.log("Attributes of the Selected Feature:", record.feature.attributes);
  };

  const generateTestPDF = () => {
    console.log("Generating Test PDF");

    const featureName = selectedRecord?.feature.attributes?.name || "Unknown Name";

    const slideContent = {
      stack: [
        {
          text: featureName,
          fontSize: 24,
          alignment: 'center',
          margin: [0, 0, 0, 20],
          fillColor: 'yellow',
        },
        {
          canvas: [
            {
              type: 'rect',
              x: 0, y: 0,
              w: 515, h: 40, // Adjust width and height as per requirement
              color: 'red'
            }
          ]
        }
      ]
    };


    const docDefinition = {
      content: [
        slideContent,
        slideContent,
        slideContent
      ],
      pageSize: 'A4',
      pageOrientation: 'portrait'
    };

    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      console.log("Test PDF blob generated:", blob);
      setPdfBlob(blob);
      setShowPDF(true);
    });
  };


  const handleReportClick = () => {
    console.log("handleReportClick triggered");
    console.log("dsRef.current:", dsRef.current);
    generateTestPDF(); // Always generate a test PDF for now
  };

  const dataRender = (ds: DataSource, info: IMDataSourceInfo) => {
    if (!ds) return null;

    dsRef.current = ds;
    console.log("Data source updated:", dsRef.current);

    const newRecords = dsRef.current.getRecords();

    // Check if records have changed by comparing lengths
    if (newRecords.length !== records.length) {
      setRecords(newRecords);
    }

    const fName = props.useDataSources && props.useDataSources[0] && props.useDataSources[0].fields ? props.useDataSources[0].fields[0] : null;

    return (
      <>
        <div className="record-list" style={{ width: '100%', marginTop: '20px', height: 'calc(100% - 80px)', overflow: 'auto' }}>
          <select onChange={handleDropdownChange}>
            {records.map((record, i) => (
              <option key={i} value={i}>
                {record.getData()[fName] || "Unnamed"}
              </option>
            ))}
          </select>
          <button onClick={handleReportClick}>View Report</button>
        </div>
        {showPDF && (
          <Document
            file={pdfBlob}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from(
              new Array(numPages),
              (el, index) => (
                <Page key={`page_${index + 1}`} pageNumber={index + 1} />
              ),
            )}
          </Document>
        )}
      </>
    );
  };

  const isDsConfigured = () => {
    return props.useDataSources &&
      props.useDataSources.length === 1 &&
      props.useDataSources[0].fields &&
      props.useDataSources[0].fields.length === 1;
  };

  const getQuery = () => {
    if (!isDsConfigured()) {
      return;
    }
    const fieldName = props.useDataSources[0].fields[0];
    const w = '1=1';
    return {
      where: w,
      outFields: ['*'],
      returnGeometry: true,
      pageSize: 10
    };
  };

  if (!isDsConfigured()) {
    return <h3>This widget demonstrates how to use a feature layer as a data source. Configure the data source.</h3>
  }

  return (
    <div className="widget-use-feature-layer" style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
      <DataSourceComponent useDataSource={props.useDataSources[0]} query={getQuery()} widgetId={props.id} queryCount>
        {dataRender}
      </DataSourceComponent>
    </div>
  );
}
