const db = require("../../models/models");

module.exports = (projectId, website, apiKey, dashboardOrder, modelTemplate) => {
  const model = modelTemplate(website, apiKey, dashboardOrder);

  model.Connection.project_id = projectId;

  const createDatasets = (datasets, connectionId, chartId) => {
    const datasetPromises = [];
    // now go through the datasets
    const newDatasets = datasets.map(
      (d) => ({ ...d, chart_id: chartId, connection_id: connectionId })
    );

    newDatasets.forEach((d) => {
      datasetPromises.push(
        db.Dataset.create(d)
          .then((createdDataset) => {
            const newDr = d.DataRequest;
            newDr.dataset_id = createdDataset.id;
            return db.DataRequest.create(newDr);
          })
      );
    });

    return Promise.all(datasetPromises);
  };

  return db.Connection.create(model.Connection)
    .then((connection) => {
      const chartPromises = [];
      // now go through all the charts
      model.Charts.forEach((chart) => {
        const newChart = chart;
        newChart.project_id = projectId;

        chartPromises.push(
          db.Chart.create(newChart)
            .then(async (createdChart) => {
              const createdDatasets = await createDatasets(
                chart.Datasets,
                connection.id,
                createdChart.id
              );

              return {
                chart: createdChart,
                datasets: createdDatasets,
              };
            })
        );
      });

      return Promise.all(chartPromises);
    })
    .catch((err) => {
      return err;
    });
};
