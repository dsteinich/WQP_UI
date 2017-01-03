/* jslint browser: true */
/* global L */
/* global Config */
/* global $ */


var NLDI = NLDI || {};


NLDI.overlays = function(map) {
	"use strict";
	var map = map;
	var nldiUrl = Config.NLDI_SERVICES_ENDPOINT;
	var site = Config.site;
	var f = 'wqp';
	var e = 'UT';
	var g = 'DM';
	var c = site['MonitoringLocationIdentifier'];
	var d = '16.1';
	var distanceParam = {distance : d};
	var localBaseUrl = Config.localBaseUrl;

	var allExtents = {
		"features": [],
		"properties": {
			"title": "all wqp extents"
		},
		"type": "FeatureCollection"
	};

	var geojsonWqpMarkerOptions = {
		radius: 4,
		fillColor: "#ff7800",
		color: "#000",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.8
	};

	var geojsonThisSiteMarkerOptions = {
		radius: 25,
		fillColor: "#35ECFF",
		color: "#000",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.8
	};

	var downstreamLineStyle = {
		"color": "#41b6c4",
		"weight": 5,
		"opacity": 0.65
	};

	var upstreamLineStyle = {
		"color": "#253494",
		"weight": 5,
		"opacity": 0.65,
		"dashArray": '15,8',
		"lineJoin": 'square'
	};

	var onEachPointFeature = function(feature, layer) {
		var parser = document.createElement('a');
		parser.href =  feature.properties.uri;
		var popupText = "Data Source: " + feature.properties.source
			+ "<br>Data Source Name: " + feature.properties.sourceName
			+ "<br>Station Name: " + feature.properties.name
			+ "<br>Station ID: " + feature.properties.identifier
			+ "<br>More Station Data: " + '<a href="' + localBaseUrl + parser.pathname + '">Go to site page</a>';
		layer.bindPopup(popupText);
	};

	var addPointDataToMap = function(data, markerOptions) {
		var markers = L.markerClusterGroup({chunkedLoading:true, spiderfyDistanceMultiplier:3, maxClusterRadius:15});
		var pointLayer = L.geoJson(data, {
			onEachFeature: onEachPointFeature,
			pointToLayer: function (feature, latlng) {
				return L.circleMarker(latlng, markerOptions);
			}
		});
		markers.addLayer(pointLayer);
		map.addLayer(markers);
	};

	var onEachLineFeature = function(feature, layer) {
		var popupText = "Data Source: NHD+"
			+ "<br>Reach ComID: " + feature.properties.nhdplus_comid;
		layer.bindPopup(popupText);
	};

	var addLineDataToMap = function(data, style) {
		var lineLayer = L.geoJson(data, {
			onEachFeature: onEachLineFeature,
			style: style
			});
		lineLayer.addTo(map);
		var features = data.features;
		features.forEach(function(feature) {
			allExtents.features.push(feature);
		});
		map.fitBounds(L.geoJson(allExtents).getBounds());
	};

	var addNldiLinesToMap = function(endpointUrl, style) {
		$.getJSON(endpointUrl, distanceParam, function(data) {
			addLineDataToMap(data, style);
		});
	};

	var addNldiPointsToMap = function(endpointUrl, style) {
		$.getJSON(endpointUrl, distanceParam, function(data) {
			addPointDataToMap(data, style);
		});
	};

	var WQPURLUT = nldiUrl + f + "/" + c + "/navigate/" + e + "/wqp";
	var WQPURLDM = nldiUrl + f + "/" + c + "/navigate/" + g + "/wqp";
	var NHDURLUT = nldiUrl + f + "/" + c + "/navigate/" + e;
	var NHDURLDM = nldiUrl + f + "/" + c + "/navigate/" + g;
	var WQPURLSITE = nldiUrl + f + "/" + c + "/";

	var nldiLines = [
		{url : NHDURLUT, style : upstreamLineStyle}, // upstream lines
		{url : NHDURLDM, style : downstreamLineStyle} // downstream lines
	];

	var nldiPoints = [
		{url : WQPURLUT, style : geojsonWqpMarkerOptions}, // upstream sites
		{url : WQPURLDM, style : geojsonWqpMarkerOptions} // downstream sites
	];

		// style the current site so it can be easily identified
	$.getJSON(WQPURLSITE, {}, function(data) {
		addPointDataToMap(data, geojsonThisSiteMarkerOptions);
		var coord = data.features[0].geometry.coordinates;
		var latlon = L.GeoJSON.coordsToLatLng(coord);
		map.setView(latlon, 10);
	});

	nldiLines.forEach(function(pair) {
		addNldiLinesToMap(pair.url, pair.style);
	});

	nldiPoints.forEach(function(pair) {
		addNldiPointsToMap(pair.url, pair.style);
	});
};