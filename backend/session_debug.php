<?php
session_start();
header('Content-Type: text/plain');

echo "SESSION ID: " . session_id() . PHP_EOL;
print_r($_SESSION);
