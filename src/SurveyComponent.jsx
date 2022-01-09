import React, { useState, useEffect, useCallback, memo } from 'react';
import * as Survey from 'survey-react';
import 'survey-react/survey.css';
import surveyJson from './data/survey.json';
import ArchiveComponent from './ArchiveComponent';

Survey.StylesManager.applyTheme("bootstrap");

const SurveyComponent = memo((props) => {

  const [survey, setSurvey] = useState();

  useEffect(() => {
    if (!props.packageItem) {
      setSurvey();
      return;
    }

    const preData = JSON.parse(JSON.stringify(props.packageItem));

    // convert
    if (preData?.dependencies)
      preData.dependencies = preData.dependencies.dependency.join('\r\n');
    if (preData?.releases) {
      const tmpReleases = [];
      for (const [key, value] of Object.entries(preData.releases)) {
        tmpReleases.push({ version: key, integrities: value.integrities });
      }
      preData.releases = tmpReleases;
    }

    const survey = new Survey.Model(surveyJson);
    survey.data = preData;
    survey.onComplete.add((s, o) => {
      const newData = s.data;

      // convert
      if (newData?.dependencies)
        newData.dependencies = {
          dependency: newData?.dependencies.trim().split(/\r\n/),
        };
      if (newData?.releases) {
        const tmpReleases = {};
        for (const entry of newData.releases) {
          tmpReleases[entry.version] = { integrities: entry.integrities };
        }
        newData.releases = tmpReleases;
      }

      props.onComplete(newData);
    });

    setSurvey(survey);
  }, [props, props.packageItem]);

  const archiveComplete = useCallback(
    (filesJson, release) => {
      const packageItem = { ...survey.data };
      packageItem.files = filesJson;
      if (packageItem?.latestVersion) {
        if (!packageItem?.releases) packageItem.releases = [];
        packageItem.releases = packageItem.releases.filter(r => r.version !== packageItem.latestVersion);
        packageItem.releases.push({ ...release, version: packageItem.latestVersion });
      }
      survey.data = packageItem;
    },
    [survey]
  );

  return <div>
    {survey && <Survey.Survey model={survey} />}
    <h4>SRIデータの設定</h4>
    {survey?.data?.downloadURL && (
      <a
        className=""
        href={survey.data.downloadURL}
        target="_blank"
        rel="noreferrer"
      >
        ダウンロードURLを新しいタブで開く
      </a>
    )}
    <ArchiveComponent onComplete={archiveComplete} />
  </div>;
});

export default SurveyComponent;
