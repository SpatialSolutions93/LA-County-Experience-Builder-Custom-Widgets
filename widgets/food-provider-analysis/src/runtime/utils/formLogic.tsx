// formLogic.tsx
export const useDatasetChangeHandler = (selectedDatasets, setSelectedDatasets) => {
    const handleDatasetChange = (datasetId) => {
        if (selectedDatasets.includes(datasetId)) {
            setSelectedDatasets(prev => prev.filter(id => id !== datasetId));
        } else {
            setSelectedDatasets(prev => [...prev, datasetId]);
        }
    };

    return handleDatasetChange;
};
