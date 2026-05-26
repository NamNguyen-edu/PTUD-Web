<?php
try {
    $dbh = new PDO("mysql:host=newspulsedb-newspulseg5.h.aivencloud.com;port=18427;dbname=news_db;charset=utf8mb4","avnadmin","AVNS_5kpa6shKuuTPQ13VEIo",array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));
    echo "SHOW TABLES:\n";
    $stmt = $dbh->query("SHOW TABLES");
    foreach ($stmt as $row) {
        echo implode('|', $row) . "\n";
    }
    echo "\nPUBLISHED AI rows:\n";
    $stmt2 = $dbh->query("SELECT title,status,published_at FROM articles WHERE (title LIKE '%AI%' OR excerpt LIKE '%AI%') LIMIT 50");
    foreach ($stmt2 as $row) {
        echo $row['title'] . '|' . $row['status'] . '|' . $row['published_at'] . "\n";
    }
} catch (PDOException $e) {
    echo 'ERROR: ' . $e->getMessage();
}
