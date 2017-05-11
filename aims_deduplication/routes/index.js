var express = require('express');
var fs = require('fs');
var path = require('path');
var sqlite3 = require("sqlite3").verbose();
//var db3file = "\\\\rsdi-ns01.lib.cuhk.edu.hk\\etd\\aims_data_integration\\aims_data_integration.db3";
var db3file = "D:\\working\\AIMS\\database\\sqlite_20170508\\aims_data_integration.db3";
var router = express.Router();

var SQLITE_RETRY_COUNT = 3;
var SQLITE_TIMEOUT = 30000;

var onError = function(err, res)
{
	console.log(err.message, err.stack);
	res.writeHead(500, {'content-type': 'text/plain'});
	res.end('An error occurred');
};

var getSQLiteConnection = function(isReadOnly)
{
	var db_mode = sqlite3.OPEN_READWRITE;
	if (isReadOnly !== undefined && isReadOnly)
		db_mode = sqlite3.OPEN_READONLY;
	
	var db = new sqlite3.Database(db3file, db_mode);
	db.on('error', function (err)
	{
		console.log(err.message, err.stack)
		db = null;
    });
	db.on('open', function ()
	{
		db.configure("busyTimeout", 30000);
    });
	return db;
}

var sqlite3Connect = function(isReadOnly)
{
	var db = null;
	for (var i = 0; db === null && i < 3; i++)
	{
		db = getSQLiteConnection(isReadOnly);
	}
	return db;
}


// router handlers
router.get('/', function(req, res, next)
{
  res.sendFile(path.join(__dirname, '../views', 'index.html'));
});

/*var allWOSRecordsSQL = "SELECT R.wosId, R.title, R.source, R.pubyear, MM.lastVerifyDate AS lastverifydate \
						FROM WOSRecordsInfo R \
						INNER JOIN (SELECT DISTINCT wosid FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85)) AM ON AM.wosId = R.wosId \
						LEFT JOIN (SELECT wosId, MAX(lastVerifyDate) AS lastVerifyDate from opisWOSManualMatch GROUP BY wosId) MM ON MM.wosId = R.wosId \
						ORDER BY R.v1_done DESC, R.pubyear DESC, R.wosid DESC";*/
						
/*var allWOSRecordsSQL = "SELECT * FROM \
  ( \
    SELECT R.wosId, R.title, R.source, R.pubyear, MM.lastVerifyDate AS lastverifydate \
    FROM WOSRecordsInfo R \
    INNER JOIN (SELECT DISTINCT wosid FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85)) AM ON AM.wosId = R.wosId \
    LEFT JOIN (SELECT wosId, MAX(lastVerifyDate) AS lastVerifyDate from opisWOSManualMatch GROUP BY wosId) MM ON MM.wosId = R.wosId \
    ORDER BY R.v1_done DESC, R.pubyear DESC, R.wosid DESC \
    LIMIT 1000 OFFSET 1500 \
  ) \
    UNION ALL \
  SELECT * FROM \
  ( \
    SELECT R.wosId, R.title, R.source, R.pubyear, MM.lastVerifyDate AS lastverifydate \
    FROM WOSRecordsInfo R \
    INNER JOIN (SELECT DISTINCT wosid FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85)) AM ON AM.wosId = R.wosId \
    LEFT JOIN (SELECT wosId, MAX(lastVerifyDate) AS lastVerifyDate from opisWOSManualMatch GROUP BY wosId) MM ON MM.wosId = R.wosId \
    ORDER BY R.v1_done DESC, R.pubyear DESC, R.wosid DESC \
    LIMIT 500 OFFSET 7500 \
  ) \
    UNION ALL \
  SELECT * FROM \
  ( \
    SELECT R.wosId, R.title, R.source, R.pubyear, MM.lastVerifyDate AS lastverifydate \
    FROM WOSRecordsInfo R \
    INNER JOIN (SELECT DISTINCT wosid FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85)) AM ON AM.wosId = R.wosId \
    LEFT JOIN (SELECT wosId, MAX(lastVerifyDate) AS lastVerifyDate from opisWOSManualMatch GROUP BY wosId) MM ON MM.wosId = R.wosId \
    ORDER BY R.v1_done DESC, R.pubyear DESC, R.wosid DESC \
    LIMIT 2000 OFFSET 10000 \
  ) \
    UNION ALL \
  SELECT * FROM \
  ( \
    SELECT R.wosId, R.title, R.source, R.pubyear, MM.lastVerifyDate AS lastverifydate \
    FROM WOSRecordsInfo R \
    INNER JOIN (SELECT DISTINCT wosid FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85)) AM ON AM.wosId = R.wosId \
    LEFT JOIN (SELECT wosId, MAX(lastVerifyDate) AS lastVerifyDate from opisWOSManualMatch GROUP BY wosId) MM ON MM.wosId = R.wosId \
    ORDER BY R.v1_done DESC, R.pubyear DESC, R.wosid DESC \
    LIMIT 3000 OFFSET 13000 \
  )";*/

var allWOSRecordsSQL = "SELECT * FROM \
  ( \
    SELECT R.wosId, R.title, R.source, R.pubyear, MM.lastVerifyDate AS lastverifydate \
    FROM WOSRecordsInfo R \
    INNER JOIN (SELECT DISTINCT wosid FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85)) AM ON AM.wosId = R.wosId \
    LEFT JOIN (SELECT wosId, MAX(lastVerifyDate) AS lastVerifyDate from opisWOSManualMatch GROUP BY wosId) MM ON MM.wosId = R.wosId \
    ORDER BY R.v1_done DESC, R.pubyear DESC, R.wosid DESC \
    LIMIT 500 OFFSET 5000 \
  )";
						
router.get('/get_page_count/:size', function(req, res)
{
	var size = req.params.size;
	
	var results = {};
	var recordCount = 0;
	var pages = [];
	
	var db = sqlite3Connect();
	if (db === null) return onError(new Error('Failed to connect to SQLite!'), res);
	
	db.serialize(function()
	{
		var stmt = db.prepare(allWOSRecordsSQL);
		stmt.all([], function(err, rows)
		{
			if (err || rows === undefined) return onError(err, res);
			
			recordCount = rows.length;
			for (var i=0; i<recordCount/size; i++)
			{
				var pageRange = {};
				pageRange["pagesLabel"] = parseInt(i*size + 1, 10) + "-" + (parseInt(i*size, 10) + parseInt(size, 10));
				pageRange["pagesLink"] = parseInt(i*size, 10) + "/" + size;
				if (i == 0)
					pageRange["class"] = "selected";
				pages[i] = pageRange;
			}
			results.pages = pages;
			res.json(results);
		});
		stmt.finalize();
	});
	db.close();
});

router.get('/list_wos/:firstrecord/:size', function(req, res)
{
	var firstrecord = req.params.firstrecord;
	var size = req.params.size;

	var results = {};

	var selectRecordsSQL = allWOSRecordsSQL + " LIMIT ? OFFSET ?";
	
	var db = sqlite3Connect();
	if (db === null) return onError(new Error('Failed to connect to SQLite!'), res);
	
	db.serialize(function()
	{		
		var stmt = db.prepare(selectRecordsSQL);
		stmt.all([size, firstrecord], function(err, rows)
		{
			if (err || rows === undefined) return onError(err, res);
			results.rows = rows;
			results.firstrecord = firstrecord;
			res.json(results);
		});
		stmt.finalize();
	});
	db.close();
});

router.get('/wos_item/:wosid', function(req, res)
{	
    var results = {};
	var wosid = req.params.wosid;
	
	var wosRecordDetailSQL = "SELECT wosid, document_type, title, authors, source, volume, issue, pages, publication_date FROM WOSRecordsInfo WHERE wosId = ?";
	
	var db = sqlite3Connect();
	if (db === null) return onError(new Error('Failed to connect to SQLite!'), res);
	
	var stmt = db.prepare(wosRecordDetailSQL);
	stmt.all([wosid], function(err, rows) {
		if(err || rows === undefined) return onError(err);
		results.rows = rows;
		res.json(results);
	});
	stmt.finalize();
	db.close();
});

router.get('/opis_matching_items/:wosid', function(req, res) {
    var results = {};
	var wosid = req.params.wosid;
	
	var opisMatchingItemsSQL = "SELECT AM.wosId, \
								  R.publication_id AS publicationid, R.title, R.cu_category_description, \
								  R.citation_name, R.edition_number, R.edition_subnumber, R.pagination, R.pubdate, R.author_list, R.language_name, \
								  AM.doiIsMatch AS doiismatch, AM.titleMatchValue AS titlematchvalue, \
								  AM.titleMatchType AS titlematchtype, \
								  COALESCE(MM.isMatch, CASE WHEN MX.doiIsMatch = 'Y' OR AM.titleMatchValue = MX.titleMatchValue THEN 'Y' ELSE 'N' END) AS ismatch, \
								  COALESCE(OD.isDeleted, 'N') AS isdeleted \
								FROM OPISRecordsInfo R \
								INNER JOIN (SELECT DISTINCT wosId, publicationId, titleMatchValue, doiIsMatch, titleMatchType FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85) AND wosId = ?) AM ON AM.publicationId = R.publication_id \
								LEFT JOIN (SELECT publicationId, doiIsMatch, MAX(titleMatchValue) AS titleMatchValue FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85) AND wosId = ?) MX ON MX.publicationId = R.publication_id \
								LEFT JOIN opisWOSManualMatch MM ON MM.wosId = AM.wosId AND TRIM(MM.publicationId) = TRIM(AM.publicationId) \
								LEFT JOIN opisRecordDelete OD ON TRIM(OD.publicationId) = TRIM(AM.publicationId) AND OD.isDeleted = 'Y' \
								WHERE R.ugc_category IS NOT NULL AND R.ugc_category NOT IN ('A51','A52','A53','A54','A63') \
								ORDER BY AM.titleMatchValue DESC";
	
	var db = sqlite3Connect();
	if (db === null) return onError(new Error('Failed to connect to SQLite!'), res);
	
	var stmt = db.prepare(opisMatchingItemsSQL);
	stmt.all([wosid, wosid], function(err, rows) {
		if(err || rows === undefined) return onError(err);
		results.rows = rows;
		results.rowCount = rows.length;
		res.json(results);
	});
	stmt.finalize();
	db.close();
});

router.get('/opis_matching/gather_results', function(req, res) {
	var results = {};
	
	var db = sqlite3Connect();
	if (db === null) return onError(new Error('Failed to connect to SQLite!'), res);
	
	db.serialize(function()
	{
		var stmt = db.prepare(allWOSRecordsSQL);
		stmt.all([], function(err, rows)
		{
			if (err || rows === undefined) return onError(err, res);
			
			var s_db = sqlite3Connect();
			if (s_db === null) return onError(new Error('Failed to connect to SQLite!'), res);
			
			var opisMatchingItemsSQL = "SELECT AM.wosId, \
										  R.publication_id AS publicationid, R.title, R.cu_category_description, \
										  R.citation_name, R.edition_number, R.edition_subnumber, R.pagination, R.pubdate, R.author_list, R.language_name, \
										  AM.doiIsMatch AS doiismatch, AM.titleMatchValue AS titlematchvalue, \
										  AM.titleMatchType AS titlematchtype, \
										  COALESCE(MM.isMatch, CASE WHEN MX.doiIsMatch = 'Y' OR AM.titleMatchValue = MX.titleMatchValue THEN 'Y' ELSE 'N' END) AS ismatch, \
										  COALESCE(OD.isDeleted, 'N') AS isdeleted \
										FROM OPISRecordsInfo R \
										INNER JOIN (SELECT DISTINCT wosId, publicationId, titleMatchValue, doiIsMatch, titleMatchType FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85) AND wosId = ?) AM ON AM.publicationId = R.publication_id \
										LEFT JOIN (SELECT publicationId, doiIsMatch, MAX(titleMatchValue) AS titleMatchValue FROM opisWOSMachineMatch WHERE (doiIsMatch = 'Y' OR titleMatchValue >= 0.85) AND wosId = ?) MX ON MX.publicationId = R.publication_id \
										LEFT JOIN opisWOSManualMatch MM ON MM.wosId = AM.wosId AND TRIM(MM.publicationId) = TRIM(AM.publicationId) \
										LEFT JOIN opisRecordDelete OD ON TRIM(OD.publicationId) = TRIM(AM.publicationId) AND OD.isDeleted = 'Y' \
										WHERE R.ugc_category IS NOT NULL AND R.ugc_category NOT IN ('A51','A52','A53','A54','A63') \
										  AND AM.wosId || R.publication_id || COALESCE(MM.isMatch, CASE WHEN MX.doiIsMatch = 'Y' OR AM.titleMatchValue = MX.titleMatchValue THEN 'Y' ELSE 'N' END) || COALESCE(OD.isDeleted, 'N') \
										  NOT IN (SELECT wosId || publicationid || ismatch || isdeleted FROM opisWOSManualMatchResultImage) \
										ORDER BY AM.titleMatchValue DESC";

			var k = 0;
			s_db.serialize(function()
			{
				var s_stmt = s_db.prepare(opisMatchingItemsSQL);
				for (var i=0; i<rows.length; i++)
				{
					var wosid = rows[i].wosId;

					s_stmt.all([wosid, wosid], function(err, s_rows)
					{
						if(err || s_rows === undefined) return onError(err);

						var i_db = sqlite3Connect();
						var insertResultImageSQL = "INSERT INTO opisWOSManualMatchResultImage (wosId, publicationId, isMatch, isDeleted) VALUES (TRIM(?), TRIM(?), TRIM(?), TRIM(?))";						
						i_db.serialize(function()
						{
							var insertResultImageStmt = i_db.prepare(insertResultImageSQL);

							for (var j=0; j<s_rows.length; j++)
							{
								var wosid 			= s_rows[j].wosId;
								var publicationid 	= s_rows[j].publicationid;
								var ismatch 		= s_rows[j].ismatch;
								var isdeleted 		= s_rows[j].isdeleted;
								insertResultImageStmt.run([wosid, publicationid, ismatch, isdeleted], function(s_err)
								{
									if(s_err === undefined) return onError(s_err);
									console.log("Inserted row ID: " + this.lastID);
								});
							}
							insertResultImageStmt.finalize();
							res.end();
						});
						i_db.close();
					});
				}
				s_stmt.finalize();
			});
			s_db.close();
		});
		stmt.finalize();
	});
	db.close();
});

router.get('/update_manual_match/:wosid/:publicationid/:ismatch', function(req, res)
{	
    var results = {};
	var wosid = req.params.wosid;
	var publicationid = req.params.publicationid;
	var ismatch = req.params.ismatch;
	
	var deleteOpisWOSManualMatchSQL = "DELETE FROM opisWOSManualMatch WHERE TRIM(wosId) = TRIM(?) AND TRIM(publicationId) = TRIM(?)";
	var insertOpisWOSManualMatchSQL = "INSERT INTO opisWOSManualMatch (wosId, publicationId, isMatch, lastVerifyDate) VALUES (TRIM(?), TRIM(?), TRIM(?), datetime('now'))";
	var selectOpisWOSManualMatchSQL = "SELECT wosid, lastverifydate FROM opisWOSManualMatch WHERE TRIM(wosId) = TRIM(?) AND TRIM(publicationId) = TRIM(?)";
	
	var db = sqlite3Connect(false);
	if (db === null) return onError(new Error('Failed to connect to SQLite!'), res);
	
	db.serialize(function()
	{
		db.exec("BEGIN TRANSACTION");
		
		var deleteOpisWOSManualMatchStmt = db.prepare(deleteOpisWOSManualMatchSQL);
		deleteOpisWOSManualMatchStmt.run([wosid, publicationid], function(err)
		{
			if(err !== null) 
			{
				db.exec("ROLLBACK");
				return onError(err);
			}
			console.log("Deleted row ID: " + this.changes);
		});
		deleteOpisWOSManualMatchStmt.finalize();
		
		var insertOpisWOSManualMatchStmt = db.prepare(insertOpisWOSManualMatchSQL);
		insertOpisWOSManualMatchStmt.run([wosid, publicationid, ismatch], function(err)
		{
			if(err !== null) 
			{
				db.exec("ROLLBACK");
				return onError(err);
			}
			console.log("Inserted row ID: " + this.lastID);
		});
		insertOpisWOSManualMatchStmt.finalize();
		
		var selectOpisWOSManualMatchStmt = db.prepare(selectOpisWOSManualMatchSQL);
		selectOpisWOSManualMatchStmt.all([wosid, publicationid], function(err, rows)
		{
			if(err !== null || rows === undefined) return onError(err);
			results.rows = rows;
			res.json(results);
		});
		selectOpisWOSManualMatchStmt.finalize();
		
		db.exec("COMMIT");
	});
	db.close();
});

router.get('/mark_delete/:publicationid/:isdelete', function(req, res) {
    var results = {};
	var publicationid = req.params.publicationid;
	var isdelete = req.params.isdelete;

	var deleteOpisRecordDeleteSQL = "DELETE FROM opisRecordDelete WHERE TRIM(publicationId) = TRIM(?)";
	var insertOpisRecordDeleteSQL = "INSERT INTO opisRecordDelete (publicationId, isDeleted, deleteDate) VALUES (TRIM(?), TRIM(?), datetime('now'))";
	var selectOpisRecordDeleteSQL = "SELECT publicationid, isdeleted, deletedate FROM opisRecordDelete WHERE TRIM(publicationId) = TRIM(?)";
	
	var db = sqlite3Connect(false);
	if (db === null) return onError(new Error('Failed to connect to SQLite!'), res);
	
	db.serialize(function()
	{
		db.exec("BEGIN TRANSACTION");
		
		var deleteOpisRecordDeleteStmt = db.prepare(deleteOpisRecordDeleteSQL);
		deleteOpisRecordDeleteStmt.run([publicationid], function(err)
		{
			if(err !== null) 
			{
				db.exec("ROLLBACK");
				return onError(err);
			}
			console.log("Deleted row ID: " + this.changes);
		});
		deleteOpisRecordDeleteStmt.finalize();
		
		var insertOpisRecordDeleteStmt = db.prepare(insertOpisRecordDeleteSQL);
		insertOpisRecordDeleteStmt.run([publicationid, isdelete], function(err)
		{
			if(err !== null) 
			{
				db.exec("ROLLBACK");
				return onError(err);
			}
			console.log("Inserted row ID: " + this.lastID);
		});
		insertOpisRecordDeleteStmt.finalize();
		
		var selectOpisRecordDeleteStmt = db.prepare(selectOpisRecordDeleteSQL);
		selectOpisRecordDeleteStmt.all([publicationid], function(err, rows)
		{
			if(err !== null || rows === undefined) return onError(err);
			results.rows = rows;
			res.json(results);
		});
		selectOpisRecordDeleteStmt.finalize();
		
		db.exec("COMMIT");
	});
	db.close();
});

module.exports = router;
