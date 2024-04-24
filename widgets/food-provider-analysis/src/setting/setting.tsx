/**
  Licensing

  Copyright 2022 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { React, Immutable, type IMFieldSchema, type UseDataSource, AllDataSourceTypes } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components';
import { DataSourceSelector, FieldSelector } from 'jimu-ui/advanced/data-source-selector'
export default function Setting(props: AllWidgetSettingProps<unknown>) {
  const onFieldChange = (allSelectedFields) => {
    props.onSettingChange({
      id: props.id,
      useDataSources: [{ ...props.useDataSources[0], fields: allSelectedFields.map(f => f.jimuName) }]
    });
  }

  const onToggleUseDataEnabled = (useDataSourcesEnabled) => {
    props.onSettingChange({
      id: props.id,
      useDataSourcesEnabled
    });
  }

  const onDataSourceChange = (useDataSources) => {
    props.onSettingChange({
      id: props.id,
      useDataSources
    });
  }

  const onMapWidgetSelected = (useMapWidgetIds) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds
    });
  }

  return (
    <div className="widget-setting">
      <SettingSection title="Data Source Settings">
        <DataSourceSelector
          types={Immutable([AllDataSourceTypes.FeatureLayer])}
          useDataSources={props.useDataSources}
          useDataSourcesEnabled={props.useDataSourcesEnabled}
          onToggleUseDataEnabled={onToggleUseDataEnabled}
          onChange={onDataSourceChange}
          widgetId={props.id}
        />
        {props.useDataSources && props.useDataSources.length > 0 && (
          <FieldSelector
            useDataSources={props.useDataSources}
            onChange={onFieldChange}
            selectedFields={props.useDataSources[0].fields || Immutable([])}
          />
        )}
      </SettingSection>
      <SettingSection title="Map Widget Settings">
        <SettingRow>
          <MapWidgetSelector
            onSelect={onMapWidgetSelected}
            useMapWidgetIds={props.useMapWidgetIds}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
