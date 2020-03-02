"use strict";

const fetch = require('node-fetch')

const CONFIRMED_TIME_SERIES = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv"
const RECOVERED_TIME_SERIES = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv"
const DEATHS_TIME_SERIES    = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv"

const SOURCES = [
  CONFIRMED_TIME_SERIES,
  RECOVERED_TIME_SERIES,
  DEATHS_TIME_SERIES
]

module.exports.handler = async event => {
  const cases = await Promise.all(
    SOURCES.map((s) => fetch(s))
  ).then((values) => {
    return Promise.all(values.map((v) => v.text()))
  })

  const [confirmed, recovered, deaths] = cases.map((c) => csv2JSON(c))

  improveJSONmodel(confirmed, "confirmed")
  improveJSONmodel(recovered, "recovered")
  improveJSONmodel(deaths, "deaths")

  confirmed.forEach((country, i) => {
    Object.assign(Object.assign(country, recovered[i]), deaths[i])
  })

  return {
    statusCode: 200,
    body: JSON.stringify(confirmed)
  };
};

const csv2JSON = csv => {
  const lines = csv.replace("\r", "").split("\n")
  const result = []
  const headers = lines.shift().split(",")

  lines.forEach((line) => {
    const obj = {}
    const currentLine = line.split(",")

    headers.forEach((header, i) => {
      obj[header] = currentLine[i];
    })

    result.push(obj)
  })

  return result
}

const improveJSONmodel = (timeSeries, label) => {
  timeSeries.forEach((country) => {
    country[label] = []
    Object.keys(country).forEach((k) => {
      if(k.includes("/20")) {
        let date = new Date(k)
        country[label].push({
          date: `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`,
          value: country[k]
        })

        delete country[k]
      }
    })
  })
}
