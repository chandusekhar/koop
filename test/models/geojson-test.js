/* global describe, it */

var should = require('should')
var GeoJSON = require('../../src/lib/GeoJSON')
var esri_json = require('../fixtures/esri_json_short.json')
var esri_with_null = require('../fixtures/esri_json_null.json')
var esri_with_invalid = require('../fixtures/esri_json_invalid.json')
var date_json = require('../fixtures/esri_date.json')
var sub_type = require('../fixtures/sub_type.json')

describe('GeoJSON Model', function () {
  describe('when converting esri style features to geojson', function () {
    it('should return a proper geojson object', function (done) {
      GeoJSON.fromEsri([], esri_json, function (err, geojson) {
        should.not.exist(err)
        geojson.should.be.an.instanceOf(Object)
        geojson.features.length.should.equal(esri_json.features.length)
        geojson.features[0].geometry.coordinates.length.should.equal(2)
        geojson.features[0].geometry.type.should.equal('Point')
        Object.keys(geojson.features[0].properties).length.should.equal(22)
        done()
      })
    })

    it('should handle malformed null geometries gracefully', function (done) {
      GeoJSON.fromEsri([], esri_with_null, function (err, geojson) {
        should.not.exist(err)
        geojson.features.length.should.equal(1)
        done()
      })
    })

    it('should return null when the geometry is invalid', function (done) {
      GeoJSON.fromEsri([], esri_with_invalid, function (err, geojson) {
        should.not.exist(err)
        should.not.exist(geojson.features[0].geometry)
        done()
      })
    })
  })

  describe('when converting fields with unix timestamps', function () {
    it('should convert to ISO strings', function (done) {
      GeoJSON.fromEsri(null, date_json, function (err, geojson) {
        should.not.exist(err)
        geojson.features[0].properties.last_edited_date.should.equal('2015-05-20T18:47:50.000Z')
        done()
      })
    })
  })

  describe('when getting fields with special characters in them', function () {
    // there is a field going in called (EVT.RT)
    it('should replace periods and parentheses', function (done) {
      GeoJSON.fromEsri(null, date_json, function (err, geojson) {
        should.not.exist(err)
        geojson.features[0].properties.EVTRT.should.exist
        done()
      })
    })
  })

  describe('when converting fields with domains', function () {
    it('should not overwrite a field that is not in the domain', function (done) {
      GeoJSON.fromEsri(sub_type.fields, sub_type, function (err, geojson) {
        should.not.exist(err)
        console.log(geojson.features[2])
        geojson.features[2].properties.ZONEFIELD.should.equal('D')
        done()
      })
    })

    it('should return a proper geojson object', function (done) {
      var fields = [{
        name: 'NAME',
        type: 'esriFieldTypeSmallInteger',
        alias: 'NAME',
        domain: {
          type: 'codedValue',
          name: 'NAME',
          codedValues: [
            {
              name: 'Name0',
              code: 0
            },
            {
              name: 'Name1',
              code: 1
            }
          ]
        }
      }]

      var json = {
        features: [{
          attributes: {
            NAME: 0
          }
        }, {
          attributes: {
            NAME: 1
          }
        }]
      }

      GeoJSON.fromEsri(fields, json, function (err, geojson) {
        should.not.exist(err)
        geojson.should.be.an.instanceOf(Object)
        geojson.features.length.should.equal(json.features.length)
        geojson.features[0].properties.NAME.should.equal(fields[0].domain.codedValues[0].name)
        geojson.features[1].properties.NAME.should.equal(fields[0].domain.codedValues[1].name)
        done()
      })
    })

    it('should not translate an empty field that has a domain', function (done) {
      var fields = [{
        name: 'ST_PREFIX',
        type: 'esriFieldTypeString',
        alias: 'ST_PREFIX',
        length: 3,
        domain: {
          type: 'codedValue',
          name: 'Prefix',
          codedValues: [
            {
              name: 'N',
              code: 'N'
            },
            {
              name: 'S',
              code: 'S'
            },
            {
              name: 'E',
              code: 'E'
            },
            {
              name: 'W',
              code: 'W'
            }
          ]
        }
      }]

      var json = {
        features: [{
          attributes: {
            ST_PREFIX: ' '
          }
        }]
      }

      GeoJSON.fromEsri(fields, json, function (err, geojson) {
        should.not.exist(err)
        geojson.should.be.an.instanceOf(Object)
        geojson.features.length.should.equal(json.features.length)
        geojson.features[0].properties.ST_PREFIX.should.equal(json.features[0].attributes.ST_PREFIX)
        done()
      })
    })
  })
  describe('converting date fields', function () {
    it('should not convert null fields to "1970"', function (done) {
      var fields = [{
        name: 'date',
        type: 'esriFieldTypeDate',
        alias: 'date'
      }]

      var json = {
        features: [{
          attributes: {
            date: null
          }
        }]
      }

      GeoJSON.fromEsri(fields, json, function (err, geojson) {
        should.not.exist(err)
        should.not.exist(geojson.features[0].properties.date)
        done()
      })
    })
  })
})
