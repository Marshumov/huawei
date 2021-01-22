<?php
    $ip =  $_SERVER['REMOTE_ADDR'];
    $arr = array('ip' => $ip);
    echo json_encode($arr);
?>
