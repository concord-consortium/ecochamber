const kDataSetName = 'Experimental Output',
      kAppName = "Ecochamber Experiment",
      kDataSetTemplate = {
                           name: "{name}",
                           collections: [  
                             {
                               name: "experiment_runs",
                               attrs: [
                                {name: "experiment_number", type: "categorical"}
                               ]
                             },
                             {
                               name: 'experimental_output',
                               parent: 'experiment_runs',
                               labels: {
                                 pluralCase: "experimental_outputs",
                                 setOfCasesWithArticle: "a sample"
                               },
                               attrs: [
                                {name: "hour", type: 'numeric', precision: 1},
                                {name: "CO2", unit: "mL", type: 'numeric', precision: 2},
                                {name: "O2", unit: "mL", type: 'numeric', precision: 2},
                              ]
                            }
                           ]
                         }

export function extendDataSet(newAttr) {
  codapInterface.sendRequest({
    action: 'create',
    resource: "dataContext[Experimental Output].collection[experimental_output].attribute",
    "values": [{
      name: newAttr,
      type: "numeric",
      precision: 1
    }]
  })
}

export function initCodap() {
  let requestDataContext = (name) => {
    return codapInterface.sendRequest({
      action:'get',
      resource: 'dataContext[' + name + ']'
    });
  }
  let requestCreateDataSet = (name, template) => {
    var dataSetDef = Object.assign({}, template);
    dataSetDef.name = name;
    return codapInterface.sendRequest({
      action: 'create',
      resource: 'dataContext',
      values: dataSetDef
    })
  }
  codapInterface.init({
    name: kDataSetName,
    title: kAppName,
    dimensions: {width: 750, height: 800},
    version: '0.1'
  }).then(function (iResult) {
    return requestDataContext(kDataSetName);
  }).then(function (iResult) {
    // if we did not find a data set, make one
    if (iResult && !iResult.success) {
      // If not not found, create it.
      return requestCreateDataSet(kDataSetName, kDataSetTemplate);
    } else {
      // else we are fine as we are, so return a resolved promise.
      return Promise.resolve(iResult);
    }
  }).catch(function (msg) {
    // handle errors
    console.log(msg);
  });
}

export function sendItems(items) {
  let promise = codapInterface.sendRequest({
    action: 'create',
    resource: 'dataContext[' + kDataSetName + '].item',
    values: items
  })
  guaranteeCaseTable()
  return promise
}

export function sendLog(formatStr, replaceArgs) {
  return codapInterface.sendRequest({
    action: 'notify',
    resource: 'logMessage',
    values: {formatStr, replaceArgs}
  })
}

function guaranteeCaseTable() {
  return new Promise(function (resolve, reject) {
    codapInterface.sendRequest({
      action: 'get',
      resource: 'componentList'
    })
    .then (function (iResult) {
      if (iResult.success) {
        // look for a case table in the list of components.
        if (iResult.values && iResult.values.some(function (component) {
              return component.type === 'caseTable'
            })) {
          resolve(iResult);
        } else {
          codapInterface.sendRequest({action: 'create', resource: 'component', values: {
            type: 'caseTable',
            dataContext: kDataSetName
          }}).then(function (result) {
            resolve(result);
          });
        }
      } else {
        reject('api error');
      }
    })
  });
}