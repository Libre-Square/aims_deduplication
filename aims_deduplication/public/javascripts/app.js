angular.module('wosOpisMatch', [])

.controller('mainController', function($scope, $http) {

    $scope.formData = {};
	$scope.pagesData = {};
    $scope.wosData = {};
	$scope.wosItem = {};
	$scope.opisItems = {};
	$scope.updateManualMatchResult = {};
	$scope.markDeleteResult = {};
	
	$scope.viewWOSRecord = function(wosid) {
		$http.get('/wos_item/' + wosid)
			.success(function(data) {
				$scope.wosItem = data;
				for (var i=0; i<$scope.wosData.rows.length; i++)
				{
					if ($scope.wosData.rows[i].wosid == wosid)
						$scope.wosData.rows[i]["class"] = "selected";
					else
						$scope.wosData.rows[i]["class"] = "notselected";
				}
				$scope.wosData.debuglog = data;
			})
			.error(function(data) {
				$scope.wosData.debuglog = 'Error: ' + data;
			});
	};
	
	$scope.viewMatchingOPISRecords = function(wosid) {
		var loading = {};
		loading.rowCount = 'loading...';
		$scope.opisItems = loading;
		$http.get('/opis_matching_items/' + wosid)
			.success(function(data) {
				$scope.opisItems = data;
				$scope.wosData.debuglog = data;
			})
			.error(function(data) {
				$scope.wosData.debuglog = 'Error: ' + data;
			});
	};
	
	$scope.updateManualMatch = function(wosid, publicationid, ismatch) {
		$http.get('/update_manual_match/' + wosid + '/' + publicationid + '/' + ismatch)
			.success(function(data) {
				$scope.updateManualMatchResult = data;
				for (var i=0; i<$scope.wosData.rows.length; i++)
				{
					if ($scope.wosData.rows[i].wosid == $scope.updateManualMatchResult.rows[0].wosid)
					{
						$scope.wosData.rows[i].lastverifydate = $scope.updateManualMatchResult.rows[0].lastverifydate;
						break;
					}
				}
				$scope.wosData.debuglog = data;
			})
			.error(function(data) {
				$scope.wosData.debuglog = 'Error: ' + data;
			});
	};
	
	$scope.listWOSRecords = function(pageRangeLink) {
		$http.get('/list_wos/' + pageRangeLink)
			.success(function(data) {
				$scope.wosData = data;
				for (var i=0; i<$scope.pagesData.pages.length; i++)
				{
					if ($scope.pagesData.pages[i].pagesLink == pageRangeLink)
						$scope.pagesData.pages[i]["class"] = "selected";
					else
						$scope.pagesData.pages[i]["class"] = "notselected";
				}
				$scope.viewWOSRecord($scope.wosData.rows[0].wosid);
				$scope.viewMatchingOPISRecords($scope.wosData.rows[0].wosid);
				$scope.wosData.debuglog = data;
			})
			.error(function(data) {
				$scope.wosData.debuglog = 'Error: ' + data;
			});
	};
	
	$scope.markDeleteOPISRecord = function(publicationid, isdelete) {
		$http.get('/mark_delete/' + publicationid + '/' + isdelete)
			.success(function(data) {
				$scope.markDeleteResult = data;
				if ($scope.markDeleteResult.rows.length > 0)
				{
					for (var i=0; i<$scope.opisItems.rows.length; i++)
					{
						if ($scope.opisItems.rows[i].publicationid.trim() == $scope.markDeleteResult.rows[0].publicationid.trim())
						{
							$scope.opisItems.rows[i].isdeleted = $scope.markDeleteResult.rows[0].isdeleted;
							break;
						}
					}
				}
				else
				{
					for (var i=0; i<$scope.opisItems.rows.length; i++)
					{
						if ($scope.opisItems.rows[i].publicationid == publicationid)
						{
							$scope.opisItems.rows[i].isdeleted = "N";
							break;
						}
					}
				}
				$scope.wosData.debuglog = data;
			})
			.error(function(data) {
				$scope.wosData.debuglog = 'Error: ' + data;
			});
	};
	
	$scope.parseInt = function(intValue) {
		return parseInt(intValue, 10);
	}
	
	$scope.sourceUrl = function(sourceValue) {
		return "http://ut6zj2mq3x.search.serialssolutions.com/?V=1.0&N=100&S=T_W_A&C=" + new String(sourceValue).replace(/[&apos;|&quot;|&gt;|&lt;|&amp;]/g, "").replace(/[ ]+/g, "+");
	}
	
	$scope.decodeHTML = function(sourceString) {
		if (sourceString == null)
			return "";
		return sourceString.replace(/&apos;/g, "'")
					.replace(/&quot;/g, '"')
					.replace(/&gt;/g, '>')
					.replace(/&lt;/g, '<')
					.replace(/&amp;/g, '&');
	}
	
	// Starting message...
	var pages = [];
	var pageRange = {};
	pageRange["pagesLabel"] = 'Starting...';
	pageRange["pagesLink"] = '';
	pageRange["class"] = 'startingLabel';
	pages[0] = pageRange;
	$scope.pagesData.pages = pages;
	
	// Start...
	$http.get('/get_page_count/500')
		.success(function(data) {
			$scope.pagesData = data;
			$scope.listWOSRecords('0/500');
        })
        .error(function(error) {
        });

});