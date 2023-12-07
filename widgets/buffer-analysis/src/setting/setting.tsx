import { React } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { JimuMapViewSelector } from 'jimu-ui/advanced/setting-components';

const Setting = (props: AllWidgetSettingProps<{}>) => {
  const onMapWidgetChange = (useMapViewIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapViewIds
    });
  };

  // Convert ImmutableArray to standard array, if necessary
  const useMapViewIds = Array.isArray(props.useMapWidgetIds)
    ? props.useMapWidgetIds
    : props.useMapWidgetIds?.asMutable({ deep: true }) || [];

  return (
    <div className="widget-setting-buffer-analysis">
      <JimuMapViewSelector
        onChange={onMapWidgetChange}
        useMapViewIds={useMapViewIds}
      />
    </div>
  );
};

export default Setting;






