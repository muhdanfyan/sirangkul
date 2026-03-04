/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.13-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: sirangkul
-- ------------------------------------------------------
-- Server version	10.11.13-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approval_workflows`
--

DROP TABLE IF EXISTS `approval_workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_workflows` (
  `id` char(36) NOT NULL,
  `proposal_id` char(36) NOT NULL,
  `approver_id` char(36) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `approval_workflows_proposal_id_foreign` (`proposal_id`),
  KEY `approval_workflows_approver_id_foreign` (`approver_id`),
  CONSTRAINT `approval_workflows_approver_id_foreign` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `approval_workflows_proposal_id_foreign` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_workflows`
--

LOCK TABLES `approval_workflows` WRITE;
/*!40000 ALTER TABLE `approval_workflows` DISABLE KEYS */;
INSERT INTO `approval_workflows` VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcde0','a1b2c3d4-e5f6-7890-1234-567890abcdef','a1b2c3d4-e5f6-7890-1234-567890abcde2','pending','','2025-12-07 04:16:00',NULL),
('a1b2c3d4-e5f6-7890-1234-567890abcde1','b2c3d4e5-f6a7-8901-2345-67890abcdef1','a1b2c3d4-e5f6-7890-1234-567890abcde2','approved','Sudah sesuai','2025-12-07 04:16:00',NULL),
('a1b2c3d4-e5f6-7890-1234-567890abcde2','b2c3d4e5-f6a7-8901-2345-67890abcdef1','a1b2c3d4-e5f6-7890-1234-567890abcde3','approved','Setuju','2025-12-07 04:16:00',NULL),
('a1b2c3d4-e5f6-7890-1234-567890abcde3','b2c3d4e5-f6a7-8901-2345-67890abcdef1','a1b2c3d4-e5f6-7890-1234-567890abcde5','approved','OK','2025-12-07 04:16:00',NULL),
('a1b2c3d4-e5f6-7890-1234-567890abcde4','b2c3d4e5-f6a7-8901-2345-67890abcdef1','a1b2c3d4-e5f6-7890-1234-567890abcde4','approved','Siap dibayarkan','2025-12-07 04:16:00',NULL),
('a1b2c3d4-e5f6-7890-1234-567890abcde5','c3d4e5f6-a7b8-9012-3456-7890abcdef2','a1b2c3d4-e5f6-7890-1234-567890abcde2','approved','Sudah sesuai','2025-12-07 04:16:00',NULL),
('a1b2c3d4-e5f6-7890-1234-567890abcde6','c3d4e5f6-a7b8-9012-3456-7890abcdef2','a1b2c3d4-e5f6-7890-1234-567890abcde3','pending','','2025-12-07 04:16:00',NULL);
/*!40000 ALTER TABLE `approval_workflows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_foreign` (`user_id`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcde0','a1b2c3d4-e5f6-7890-1234-567890abcde1','CREATE','{\"module\":\"Proposal\",\"details\":\"Membuat proposal baru: Renovasi Ruang Kelas 7A\",\"ipAddress\":\"192.168.1.101\",\"status\":\"Success\"}','2025-12-07 04:16:00'),
('a1b2c3d4-e5f6-7890-1234-567890abcde1','a1b2c3d4-e5f6-7890-1234-567890abcde2','UPDATE','{\"module\":\"Approval\",\"details\":\"Menyetujui proposal - Pembelian Komputer Lab\",\"ipAddress\":\"192.168.1.102\",\"status\":\"Success\"}','2025-12-07 04:16:00'),
('a1b2c3d4-e5f6-7890-1234-567890abcde2','a1b2c3d4-e5f6-7890-1234-567890abcde0','CREATE','{\"module\":\"User Management\",\"details\":\"Menambahkan user baru\",\"ipAddress\":\"192.168.1.100\",\"status\":\"Success\"}','2025-12-07 04:16:00'),
('a1b2c3d4-e5f6-7890-1234-567890abcde3','a1b2c3d4-e5f6-7890-1234-567890abcde4','UPDATE','{\"module\":\"Payment\",\"details\":\"Memproses pembayaran\",\"ipAddress\":\"192.168.1.103\",\"status\":\"Success\"}','2025-12-07 04:16:00'),
('a1b2c3d4-e5f6-7890-1234-567890abcde4','a1b2c3d4-e5f6-7890-1234-567890abcde1','LOGIN','{\"module\":\"Authentication\",\"details\":\"Login ke sistem\",\"ipAddress\":\"192.168.1.101\",\"status\":\"Success\"}','2025-12-07 04:16:00');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `proposal_id` char(36) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `feedback_user_id_foreign` (`user_id`),
  KEY `feedback_proposal_id_foreign` (`proposal_id`),
  CONSTRAINT `feedback_proposal_id_foreign` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
  CONSTRAINT `feedback_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcde0','a1b2c3d4-e5f6-7890-1234-567890abcde1','a1b2c3d4-e5f6-7890-1234-567890abcdef','Renovasi sudah sesuai dengan kebutuhan. Terima kasih.','2025-12-07 04:16:00'),
('a1b2c3d4-e5f6-7890-1234-567890abcde1','a1b2c3d4-e5f6-7890-1234-567890abcde2','b2c3d4e5-f6a7-8901-2345-67890abcdef1','Mohon segera diproses untuk pengadaan proyektor lab.','2025-12-07 04:16:00'),
('a1b2c3d4-e5f6-7890-1234-567890abcde2','a1b2c3d4-e5f6-7890-1234-567890abcde3','c3d4e5f6-a7b8-9012-3456-7890abcdef2','Program pelatihan guru sangat penting. Setuju untuk dilaksanakan.','2025-12-07 04:16:00');
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
(1,'0001_01_01_000001_create_cache_table',1),
(2,'0001_01_01_000002_create_jobs_table',1),
(3,'2025_10_11_132756_create_users_table',1),
(4,'2025_10_11_132815_create_proposals_table',1),
(5,'2025_10_11_132833_create_rkam_table',1),
(6,'2025_10_11_132852_create_payments_table',1),
(7,'2025_10_11_132916_create_feedback_table',1),
(8,'2025_10_11_132936_create_audit_logs_table',1),
(9,'2025_10_11_132956_create_approval_workflows_table',1),
(10,'2025_10_11_133018_create_proposal_attachments_table',1),
(11,'2025_10_11_133044_create_notifications_table',1),
(12,'2025_10_11_213437_create_sessions_table',1),
(13,'2025_10_12_091229_rename_password_hash_to_password_in_users_table',1),
(14,'2025_10_12_143911_create_personal_access_tokens_table',1),
(15,'2025_10_30_031857_add_status_to_users_table',1),
(16,'2025_11_05_085348_modify_rkam_table_structure',1),
(17,'2025_11_05_085422_add_rkam_id_to_proposals_table',1),
(18,'2025_11_06_062754_add_approval_workflow_columns_to_proposals_table',1),
(19,'2025_11_06_100000_add_payment_management_columns_to_payments_table',1),
(20,'2025_11_07_055724_add_payment_proof_file_to_payments_table',1),
(21,'2025_11_07_055917_add_rejection_fields_to_proposals_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_foreign` (`user_id`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `proposal_id` char(36) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  `recipient_account` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `payment_method` enum('transfer','cash','check') NOT NULL DEFAULT 'transfer',
  `payment_reference` varchar(100) DEFAULT NULL,
  `payment_proof_url` varchar(500) DEFAULT NULL,
  `payment_proof_file` varchar(255) DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT NULL,
  `status` enum('pending','processing','completed','failed','paid') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `processed_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_proposal_id_foreign` (`proposal_id`),
  KEY `payments_processed_by_foreign` (`processed_by`),
  KEY `payments_status_index` (`status`),
  CONSTRAINT `payments_processed_by_foreign` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payments_proposal_id_foreign` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES
('1486c4f6-7aff-470c-993a-ded0f8415f18','5b54c6e1-4743-474e-856a-32ac11e75a5a',50000000.00,'Ahmad','071203980809809','Testing','transfer','kdas','https://example.com','payment_proofs/payment_1486c4f6-7aff-470c-993a-ded0f8415f18_1766981685.png',NULL,'completed','dalksjxna kj','mdoaxap sc;alkc alksmd','2025-12-29 03:28:51','2025-12-29 04:14:45','a1b2c3d4-e5f6-7890-1234-567890abcde4','2025-12-29 03:28:51','2025-12-29 04:14:45'),
('9dd0c1f3-c6bb-494c-b0b1-9d076d09bafb','748cf2a6-2aef-4a50-a52d-3d0bc7ad9455',400000000.00,'Ahmad','542635624525245','BANK MANDIRI','transfer',NULL,'https://example.com','payment_proofs/payment_9dd0c1f3-c6bb-494c-b0b1-9d076d09bafb_1766983280.png',NULL,'completed','dsaadsasdcavsd asd dfsd','adsjdj lkjsndkad','2025-12-29 03:26:06','2025-12-29 04:41:20','a1b2c3d4-e5f6-7890-1234-567890abcde4','2025-12-29 03:26:06','2025-12-29 04:41:20'),
('a1b2c3d4-e5f6-7890-1234-567890abcde0','b2c3d4e5-f6a7-8901-2345-67890abcdef1',8500000.00,'Lab Komputer','1234567890','Bank Mandiri','transfer',NULL,NULL,NULL,NULL,'completed',NULL,NULL,'2025-01-14 09:00:00','2025-01-14 14:00:00','a1b2c3d4-e5f6-7890-1234-567890abcde4','2025-12-07 04:16:00','2025-12-07 04:16:00'),
('a1b2c3d4-e5f6-7890-1234-567890abcde1','c3d4e5f6-a7b8-9012-3456-7890abcdef2',12000000.00,'Lembaga Pelatihan Guru','0987654321','BRI','transfer',NULL,NULL,NULL,NULL,'processing',NULL,NULL,'2025-01-16 08:00:00',NULL,'a1b2c3d4-e5f6-7890-1234-567890abcde4','2025-12-07 04:16:00','2025-12-07 04:16:00');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` char(36) NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=230 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES
(1,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','db61ae798825144b02a8bc19f7098d31e0ee31cfe266c4dda3cdc8b33521c887','[\"*\"]','2025-12-07 04:16:13',NULL,'2025-12-07 04:16:12','2025-12-07 04:16:13'),
(2,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','e84d648df2f8c659009266dad552a56c5369f56385889de825ce9032ad63d884','[\"*\"]',NULL,NULL,'2025-12-07 04:30:38','2025-12-07 04:30:38'),
(3,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','7cfa2a9a3f547bd8b4ed283f5a1cc084f1b16cbbdd2ce99f30e2d10199bebebf','[\"*\"]',NULL,NULL,'2025-12-07 04:31:41','2025-12-07 04:31:41'),
(4,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','8d3a9f33393ad21a57858a20a329e670bf4815ebc4f12499a6b516c5216187c3','[\"*\"]','2025-12-07 04:47:17',NULL,'2025-12-07 04:47:17','2025-12-07 04:47:17'),
(5,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','ce8352bc737abbe1c6c710851ea06ca35df0db20d0bf79d302163671a7741a9b','[\"*\"]',NULL,NULL,'2025-12-07 04:50:13','2025-12-07 04:50:13'),
(6,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','14a01f1084b753ee8e507c3838e9c84d70e9778842462639d26f55297275edab','[\"*\"]','2025-12-07 04:50:28',NULL,'2025-12-07 04:50:20','2025-12-07 04:50:28'),
(7,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','03729164b318b91c8d2b734228d74d097c5013658651410534b616216c26beb8','[\"*\"]',NULL,NULL,'2025-12-07 04:50:35','2025-12-07 04:50:35'),
(8,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','57693bdc66e52b25bc8e6c3b318702f79215a6b60ccf6f5539f1aecfcb96c261','[\"*\"]',NULL,NULL,'2025-12-07 04:50:40','2025-12-07 04:50:40'),
(9,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','442cad112ba894382e4a5d365824bdd772a054e91e8af39a44cb577fc0402be5','[\"*\"]',NULL,NULL,'2025-12-07 04:51:35','2025-12-07 04:51:35'),
(10,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','51fe10358e9ea558b75269455423ee94fd844a01b73862a06c43d21843fdc6bc','[\"*\"]','2025-12-07 04:52:30',NULL,'2025-12-07 04:52:20','2025-12-07 04:52:30'),
(11,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','d8244e8a869fbe3578bd18a3c4479bf7214ac6cce94c9322a799b3eb7e768123','[\"*\"]','2025-12-07 04:56:34',NULL,'2025-12-07 04:56:01','2025-12-07 04:56:34'),
(12,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','ee41303c8bcf3fd629cf82b3f166e2718b9597c7d0b47d4d2026f7970087ebf3','[\"*\"]',NULL,NULL,'2025-12-07 05:03:41','2025-12-07 05:03:41'),
(13,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','66340e404b3a01e27f3a968d7da4905c28d7a3aabe0486b9976038d8a4efab48','[\"*\"]',NULL,NULL,'2025-12-07 05:04:14','2025-12-07 05:04:14'),
(14,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','85fedcfb1412b08c454e7823a5d7cd9b327589c769300b9867ff9072de7aa524','[\"*\"]','2025-12-07 05:05:56',NULL,'2025-12-07 05:05:17','2025-12-07 05:05:56'),
(15,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','ebc6153aa7f2ec99ddde993cb6aa2cb26ff7111081f46806cda24e593067b64b','[\"*\"]',NULL,NULL,'2025-12-07 05:06:45','2025-12-07 05:06:45'),
(16,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','490ff1a63f8d0f4e9a4f28a95c2cb98d0a0c2d9fdfbc8ff4d47b1325a0b41fc3','[\"*\"]',NULL,NULL,'2025-12-07 05:06:53','2025-12-07 05:06:53'),
(17,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','a5dc677aa9b2a582c4409cee86114f91b41a1c7f06dd837b40eb1f68eeabdf6f','[\"*\"]',NULL,NULL,'2025-12-07 05:08:57','2025-12-07 05:08:57'),
(18,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','9552e49d17bf01a3fe4dccfd661a87554b8c18299c294503f819fddd3e4bf197','[\"*\"]','2025-12-07 08:08:34',NULL,'2025-12-07 08:05:59','2025-12-07 08:08:35'),
(19,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','ae10ab53a3c34a3725a353bbaf88b62f04afd8fa3a597a2c39b9ca94c7ad38f2','[\"*\"]','2025-12-07 08:09:48',NULL,'2025-12-07 08:08:39','2025-12-07 08:09:48'),
(20,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','19c01cf79d7ee878f8a9be8a8851cfaa803bab5ddf5938eb0bbddcd76f5b7c25','[\"*\"]','2025-12-07 08:10:18',NULL,'2025-12-07 08:10:01','2025-12-07 08:10:18'),
(21,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','6aaf92ec4d35311dfa5d20f14ed38aa881a83d77334612eaa8103703b57f599e','[\"*\"]','2025-12-07 08:12:56',NULL,'2025-12-07 08:10:27','2025-12-07 08:12:56'),
(22,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','b1135c51c7a7a1e0f16187eaef772a10fb00bf4c21e67417f77b290b64291325','[\"*\"]','2025-12-07 08:13:23',NULL,'2025-12-07 08:13:04','2025-12-07 08:13:23'),
(23,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','7df4e53dc409f32371d23a8e1690b4832283872bfc375937fac7a66aced0c1d7','[\"*\"]','2025-12-07 08:14:55',NULL,'2025-12-07 08:13:26','2025-12-07 08:14:55'),
(24,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','c36d2b8a3476a72f8085775c3761da28e6a91f9c3b66202e9d6691c421a06ed3','[\"*\"]',NULL,NULL,'2025-12-07 08:37:08','2025-12-07 08:37:08'),
(25,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','c215bad12f5e0695ace70bc4e0d274969ea4e63230c0c3681378fdda56e51bd3','[\"*\"]','2025-12-07 16:20:40',NULL,'2025-12-07 16:20:04','2025-12-07 16:20:40'),
(26,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','c67856b2757e42c151662184a156d547ac386e9440c86248947fd8c2db376555','[\"*\"]',NULL,NULL,'2025-12-07 16:20:43','2025-12-07 16:20:43'),
(27,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','5803c235b35c0aa401b1b86b24f2b5b013c256eee7d48ebccf91a6d6b046bf34','[\"*\"]',NULL,NULL,'2025-12-07 16:20:52','2025-12-07 16:20:52'),
(28,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','e10259c44f79250f2e3666f61e5d49f1ff5112f01b7bf2a1a64ffe4fa2d88673','[\"*\"]',NULL,NULL,'2025-12-07 16:22:15','2025-12-07 16:22:15'),
(29,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','946f42ab6da418ff0275009cf9da97305a22e5c3c9588eb1999e9c224b3bedd7','[\"*\"]',NULL,NULL,'2025-12-07 16:24:17','2025-12-07 16:24:17'),
(30,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','7cc17548a26463ccfd205aa4f7887a65668fc72635f43de86abc2a61c220b0b8','[\"*\"]','2025-12-07 16:28:41',NULL,'2025-12-07 16:25:41','2025-12-07 16:28:41'),
(31,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','e64c3f10fe1d88d78257ede3d8ebe1a1910c620746b920085a712ec0cc518d1d','[\"*\"]',NULL,NULL,'2025-12-07 21:11:26','2025-12-07 21:11:26'),
(32,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','b474ea4e0af9c39b852c60b733ad2f524012495ea47c189a8b9b0adad3c9a0f1','[\"*\"]',NULL,NULL,'2025-12-28 16:48:37','2025-12-28 16:48:37'),
(33,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','cb28b30c6ac82aa135f34634555ffc31addeb5aa4bbeb45d3c0e7e5c5035e424','[\"*\"]','2025-12-28 17:12:22',NULL,'2025-12-28 17:11:57','2025-12-28 17:12:22'),
(34,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','460d83ab9b4660d68edbd6f9b37930c620c1c360e5d3503ab4b5621406a31f8e','[\"*\"]',NULL,NULL,'2025-12-28 17:12:42','2025-12-28 17:12:42'),
(35,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','d3cb80e329081435214e9417ce299e2a73a10c55e6a4de4366a9e65d0cf40218','[\"*\"]',NULL,NULL,'2025-12-28 17:13:31','2025-12-28 17:13:31'),
(36,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','c2034912a861d230b26d64b530330b64681937ba24604aa6abd62f168f5e5ae7','[\"*\"]',NULL,NULL,'2025-12-28 17:32:19','2025-12-28 17:32:19'),
(37,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','5b2da9578079a42faaa6a38f5a2a738c5d52537e9ba200f23526464a44be4d92','[\"*\"]','2025-12-29 01:28:57',NULL,'2025-12-29 01:28:36','2025-12-29 01:28:57'),
(38,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','ebda0b11d48c90ad3d8c7cb159c8d8c8b4e47c554ed99fbf1e8cc8dd1f460969','[\"*\"]','2025-12-29 02:43:10',NULL,'2025-12-29 02:42:18','2025-12-29 02:43:10'),
(39,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','93a90b8760f8102e13ce4e6ce5e36c7a56a728cca9590a636a458020579a994a','[\"*\"]','2025-12-29 02:50:30',NULL,'2025-12-29 02:47:14','2025-12-29 02:50:30'),
(40,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','280d6439cad6ff8a2c5cc60c8aa23ba538a5c75cb5f63a07f654ac311d8ef284','[\"*\"]',NULL,NULL,'2025-12-29 02:53:41','2025-12-29 02:53:41'),
(41,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','abe2276a08c1880b49fcded65785f41450b2e32d910284ba639ba237d0d20f1d','[\"*\"]','2025-12-29 04:18:42',NULL,'2025-12-29 02:55:47','2025-12-29 04:18:42'),
(42,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','8f095872e6caa5fb606612e6e9e7f01b12988e56575671b5f9b07baa6f6cb8ab','[\"*\"]',NULL,NULL,'2025-12-29 03:06:14','2025-12-29 03:06:14'),
(43,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','cae73f687773c9eaf759c075e6b4d7a722fd17943bf73923c72f41895634ccc6','[\"*\"]','2025-12-29 03:10:10',NULL,'2025-12-29 03:06:23','2025-12-29 03:10:10'),
(44,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','6b4cffadb44b0ee3cc17f436b40151258af378549ebc0e01f5cd95e7f9663f03','[\"*\"]','2025-12-29 03:20:01',NULL,'2025-12-29 03:10:13','2025-12-29 03:20:01'),
(45,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','9971f40ffd1ddce4fa50857c13fd8b586f10ba6b779d226f6202149ed6757882','[\"*\"]','2025-12-29 03:22:38',NULL,'2025-12-29 03:21:25','2025-12-29 03:22:38'),
(46,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','4ff98b60c0a430033685ec879a4af133b8ee782699c015304b71c0372c22a0f8','[\"*\"]','2025-12-29 03:23:02',NULL,'2025-12-29 03:22:43','2025-12-29 03:23:02'),
(47,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','fb709f8252b2767075c8e88c9fa1cd4c0e5ae3de6a50a1ba7edd8ce422da87bd','[\"*\"]','2025-12-29 03:23:26',NULL,'2025-12-29 03:23:06','2025-12-29 03:23:26'),
(48,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','06db4f00dff95e6ce438e0c61a7e55c3d00daa4182060d1df67039e3cd34b340','[\"*\"]','2025-12-29 03:24:50',NULL,'2025-12-29 03:24:29','2025-12-29 03:24:50'),
(49,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','948298f8918801771517f2003c98ae55e01453bbb55ccd8ea344c8a4b7b52ade','[\"*\"]','2025-12-29 03:25:10',NULL,'2025-12-29 03:24:56','2025-12-29 03:25:10'),
(50,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','afc1c47ab1b7f0474db776f49465b3da85c3d9f27a6fe6ffeb19f4a0cea4bd41','[\"*\"]','2025-12-29 03:25:28',NULL,'2025-12-29 03:25:15','2025-12-29 03:25:28'),
(51,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','7de2e26f0cc6888c379e534697da1eb4abe3cc18b4931b7059d6e70392bcbf6e','[\"*\"]','2025-12-29 03:26:06',NULL,'2025-12-29 03:25:32','2025-12-29 03:26:06'),
(52,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','3122b78f4226743c1ecc39041ff2c1d1c4dcbb01c3c7fb8a9496d6ffaf295c2a','[\"*\"]','2025-12-29 03:27:22',NULL,'2025-12-29 03:26:15','2025-12-29 03:27:22'),
(53,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','70f829646e9f9d5fc095754138cc3e7e3b55d3c6d94ead51bfd4a7cb2af233d5','[\"*\"]','2025-12-29 03:27:47',NULL,'2025-12-29 03:27:33','2025-12-29 03:27:47'),
(54,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','300b1acf189c6356bc4bbb1105b603868016e88ed864002bff3eed83cad6a52d','[\"*\"]','2025-12-29 03:28:05',NULL,'2025-12-29 03:27:56','2025-12-29 03:28:05'),
(55,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','9b66293fe735299b3b0bc4bfd12db310b035cafb427083f3c9b22c685e654498','[\"*\"]','2025-12-29 03:29:23',NULL,'2025-12-29 03:28:10','2025-12-29 03:29:23'),
(56,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','b59ad19d039c10d3dca01f9b1cfd49d68d86ddcf5eb26dec49485886ba137b17','[\"*\"]','2025-12-29 04:06:50',NULL,'2025-12-29 03:32:01','2025-12-29 04:06:50'),
(57,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','027fcb3e6792f605edc72fc04f01ed45f86632bf63cfccab07ef3bf72ece62c7','[\"*\"]','2025-12-29 04:14:15',NULL,'2025-12-29 04:07:02','2025-12-29 04:14:15'),
(58,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','61445a3d83fb37d82c73385b0d4156978a24f401d724df84d055893e11cb8a71','[\"*\"]','2025-12-29 04:41:20',NULL,'2025-12-29 04:14:19','2025-12-29 04:41:20'),
(59,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','423e78943a02f5cd2b195016cc59df5197108556e939273ee168bc053927a049','[\"*\"]',NULL,NULL,'2025-12-29 04:20:27','2025-12-29 04:20:27'),
(60,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','385c912c556cc8374e6c09b3bd938a6b859af2910e4988a19bf9892916a1e4d2','[\"*\"]','2025-12-29 04:21:45',NULL,'2025-12-29 04:20:34','2025-12-29 04:21:45'),
(61,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','8ccabd1b09e087d2d413682c5b56ab8adfecf2fd201da9e3b3a127d0726be63e','[\"*\"]','2025-12-29 04:24:45',NULL,'2025-12-29 04:23:10','2025-12-29 04:24:45'),
(62,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','ca630e89e1f7ad9b818f0c1db4b34eb3ca3d2d0ebfdea33b125f94fe33c71fe3','[\"*\"]',NULL,NULL,'2025-12-29 04:26:15','2025-12-29 04:26:15'),
(63,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','2789ee93c00e38d7a15774a48ed85ac5b2a385d0a474da1fb11b1a3d7e0b7c62','[\"*\"]',NULL,NULL,'2025-12-29 04:46:01','2025-12-29 04:46:01'),
(64,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','afda72c11aec7b24757b54aac3e91e7d67b5fa8e48c086fcd77a36f73c069bb6','[\"*\"]',NULL,NULL,'2025-12-29 05:14:36','2025-12-29 05:14:36'),
(65,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','f8dec066252523f07bedb2a2372e57691af13ce6a895161c154e56e898607fa0','[\"*\"]',NULL,NULL,'2025-12-29 06:26:10','2025-12-29 06:26:10'),
(66,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','0e6de4d3b2b61941452d440780cb0e03b280b2c25a0e6f00c626a64fdd433ca3','[\"*\"]','2025-12-29 06:36:34',NULL,'2025-12-29 06:36:28','2025-12-29 06:36:34'),
(67,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','c420f4cae72fada9132617f4ccc8cdf0b12e7961e308a9d2b3bb83d730cdd3a3','[\"*\"]',NULL,NULL,'2025-12-29 06:40:54','2025-12-29 06:40:54'),
(68,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','444b37d2856bd36a2e6d72327e3b3541e5eccbe25bc05a75efba0e6ae6a8f749','[\"*\"]',NULL,NULL,'2025-12-29 06:44:13','2025-12-29 06:44:13'),
(69,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','5458d205a8a3047335af18b38270f2ee6211edff0864e7c075520301d6d38492','[\"*\"]',NULL,NULL,'2025-12-29 07:05:05','2025-12-29 07:05:05'),
(70,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','17eb12257a5c4f52fd51c702cd0d91379cd7d7a7616244238ae1378b5404f982','[\"*\"]',NULL,NULL,'2025-12-29 07:05:23','2025-12-29 07:05:23'),
(71,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','0f6f757cf9ac5af12699313c29a31370838eb00cee2548b803f240e0e6de02b4','[\"*\"]','2025-12-29 07:38:05',NULL,'2025-12-29 07:25:38','2025-12-29 07:38:05'),
(72,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','b99fc637965c123afb38d9e8d2aa95222532a07de0ed8671f6bbc58b72ed8737','[\"*\"]',NULL,NULL,'2025-12-29 13:21:49','2025-12-29 13:21:49'),
(73,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','84cc923846b5ba21d433f365186b66c0d578313d362434c6665edb9642b96687','[\"*\"]',NULL,NULL,'2026-01-02 04:12:41','2026-01-02 04:12:41'),
(74,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','142af002fa665fada66dce94a14d69cf98b2f389e87c1fbd3adb79df26afd55f','[\"*\"]','2026-01-02 10:07:10',NULL,'2026-01-02 10:04:31','2026-01-02 10:07:10'),
(75,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','2821e10f55316435f665e12bff5badcc5d562bbcec662b150bbcdf571a5104df','[\"*\"]','2026-01-02 10:07:51',NULL,'2026-01-02 10:07:33','2026-01-02 10:07:51'),
(76,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','9db968613c97343ed5f2212eb3567e6ec02f0b0f3f7de659e88766492cbb219e','[\"*\"]','2026-01-02 13:23:08',NULL,'2026-01-02 13:21:10','2026-01-02 13:23:08'),
(77,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','3e460e9a5f3e9f0cc92afa4d92da59cc523e568afa12eb5e49507a509aa446fb','[\"*\"]','2026-01-02 13:24:33',NULL,'2026-01-02 13:23:26','2026-01-02 13:24:33'),
(78,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','08256525f5ba35ffcfac8a8ad8f054c720647950e7325da3fc4671737a756eb3','[\"*\"]',NULL,NULL,'2026-01-02 13:24:43','2026-01-02 13:24:43'),
(79,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','9796e06034f99d936b71696dcc9e31b4006e4b2f704ed0ccf95d57592a7ea733','[\"*\"]','2026-01-02 13:25:16',NULL,'2026-01-02 13:25:12','2026-01-02 13:25:16'),
(80,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','589f5b37328a0651789987586135ec426aa9e940e03f35a0f7531ab297469f25','[\"*\"]','2026-01-02 13:34:53',NULL,'2026-01-02 13:33:00','2026-01-02 13:34:53'),
(81,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','57e77f08af96ddeef4ee71bfa08df73e88b49abac26ec087a6a43c049548fb24','[\"*\"]',NULL,NULL,'2026-01-02 13:35:10','2026-01-02 13:35:10'),
(82,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','bddacb5fdd67ff6570f7a56d1d544c932c2b50f84e5b2074c2bab654cfdc162b','[\"*\"]','2026-01-02 13:36:23',NULL,'2026-01-02 13:35:32','2026-01-02 13:36:23'),
(83,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','90a9da8a949060ba9d38f82f2b116ff920d7b91bcdc00880f4f52a48512c67ff','[\"*\"]',NULL,NULL,'2026-01-02 14:07:02','2026-01-02 14:07:02'),
(84,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','ab04e2fd9988d56de8987c7b01a231f881995ba1c8cc35a8b8f8007b15699ea4','[\"*\"]','2026-02-02 13:32:24',NULL,'2026-02-02 13:28:13','2026-02-02 13:32:24'),
(85,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','0729e2ba3b0085129418ee9ee76c9c0af0ee2b8dca63ef78252fa9aa86c9e8e0','[\"*\"]',NULL,NULL,'2026-02-02 13:32:28','2026-02-02 13:32:28'),
(86,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','e5728a577a381421a156b5d0052ac9d877a7bd9e0d7e2e43ca8c200e645a694b','[\"*\"]',NULL,NULL,'2026-02-02 13:34:52','2026-02-02 13:34:52'),
(87,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','53e41b04d377af088da7e2a1c300a569abbad8420ae13ff4eb4fd969b682b456','[\"*\"]',NULL,NULL,'2026-02-02 13:35:05','2026-02-02 13:35:05'),
(88,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','3b621345b4efb73ed23725f1539016af722a8b836acba810dd1b36e7501d4334','[\"*\"]','2026-02-02 14:08:22',NULL,'2026-02-02 14:07:55','2026-02-02 14:08:22'),
(89,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','702733624a14115cb7773abd8cb4ad60f75755c66e6cd5bf4f7ba610932aee18','[\"*\"]','2026-02-03 02:48:45',NULL,'2026-02-03 02:47:43','2026-02-03 02:48:45'),
(90,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','fed7345a8fac149cb73ea0d64f2ba4ee493fb9561ced737b13249bfd2b9e8c3e','[\"*\"]','2026-02-03 15:23:34',NULL,'2026-02-03 15:23:21','2026-02-03 15:23:34'),
(91,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','ab1c42a927445b64ea2eded0609684a29bcaba92b4bca49e8c6843e59b6a582a','[\"*\"]','2026-02-06 13:07:57',NULL,'2026-02-06 13:07:37','2026-02-06 13:07:57'),
(92,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','dcbe2bb7f47e2bb79c89e239bcf18ace740a1a08905ebef47efe887dd35368a7','[\"*\"]',NULL,NULL,'2026-02-07 01:43:09','2026-02-07 01:43:09'),
(93,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','20bcc326e0788c72a1890fa1d214c18744a3492f64f17bc362ae8f3d11886ab5','[\"*\"]','2026-02-07 01:47:31',NULL,'2026-02-07 01:43:21','2026-02-07 01:47:31'),
(94,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','6c711f0a24f2921213a3837f73652cfefb1ec810414945fa37f29019191f3864','[\"*\"]','2026-02-07 02:56:42',NULL,'2026-02-07 02:51:52','2026-02-07 02:56:42'),
(95,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','b01a1485e18c2ab0524008526ad481f0f54dfd62292081d8c79a2402897bb30f','[\"*\"]','2026-02-07 02:57:00',NULL,'2026-02-07 02:56:52','2026-02-07 02:57:00'),
(96,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','30cf38faa0156b2e5cde5bef2f619c179decb97584bdfdea84dc6da85f518cef','[\"*\"]',NULL,NULL,'2026-02-07 03:02:28','2026-02-07 03:02:28'),
(97,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','059140c6a3f1dd31c4f72db688c5de391424079d505643744d42b7c15966ec0b','[\"*\"]','2026-02-07 03:03:45',NULL,'2026-02-07 03:02:47','2026-02-07 03:03:45'),
(98,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','8670bc00629b937ee462332100994c4b0b62897023918f97287fa7f63709fbd8','[\"*\"]',NULL,NULL,'2026-02-07 03:02:55','2026-02-07 03:02:55'),
(99,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','0950914dcaf4a4352d3535af908ad257fdfef4fab781d754d994d86479399c1b','[\"*\"]',NULL,NULL,'2026-02-07 03:02:56','2026-02-07 03:02:56'),
(100,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','a191628ce5cd3392eecce3fc61eb67bb373715a8a3b86dc6f62c47eb574c56fa','[\"*\"]',NULL,NULL,'2026-02-07 03:03:31','2026-02-07 03:03:31'),
(101,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','5813d17eeb16b604f749c32c26ea44131bd7ac6972faa72163c8292edf026b23','[\"*\"]','2026-02-07 03:05:37',NULL,'2026-02-07 03:04:48','2026-02-07 03:05:37'),
(102,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','9c08038c3ecce46b2710b938709dd9c8c47957214739df80b26690064f6f7ca4','[\"*\"]','2026-02-07 03:06:54',NULL,'2026-02-07 03:04:53','2026-02-07 03:06:54'),
(103,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','eb267b6b3ceda45d9e4f13fc2a5eefdab5e431a9c5dfe38f1a8d088a42d95ec0','[\"*\"]',NULL,NULL,'2026-02-07 03:05:14','2026-02-07 03:05:14'),
(104,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','f665586113356bf95ce3aa492252fbfcfcbb7c0e2fc243eb97a040a588d8b737','[\"*\"]','2026-02-07 03:07:03',NULL,'2026-02-07 03:05:17','2026-02-07 03:07:03'),
(105,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','35a82333344aaf52267f5003e22a4a252c7edc506ee80b1edd27a78996e4ea22','[\"*\"]','2026-02-08 01:19:05',NULL,'2026-02-07 03:05:54','2026-02-08 01:19:05'),
(106,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','c68461de585fc06eb9023165a7bc8a1f9736a58a608f5d7d5ab8a939174a6710','[\"*\"]',NULL,NULL,'2026-02-07 03:06:01','2026-02-07 03:06:01'),
(107,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','511c9e6816eedd205577aaf1dc1ac6061f68640c9ba228d6dcb23eacc39709e0','[\"*\"]','2026-02-07 03:06:43',NULL,'2026-02-07 03:06:35','2026-02-07 03:06:43'),
(108,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','3bd75df267745e886285e0b0b042b332b4bd20b338ca0e878bf8c67bcd323808','[\"*\"]','2026-02-07 03:08:13',NULL,'2026-02-07 03:08:04','2026-02-07 03:08:13'),
(109,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','33664d00c4423dff9cd46427ba67f77628bf0667a4707349d69619de65a35ddb','[\"*\"]',NULL,NULL,'2026-02-07 03:08:31','2026-02-07 03:08:31'),
(110,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','c76d0e70ec9560fd9b6ba87e43c27d6d4ae52cbdd6504052ea5359e33c594f83','[\"*\"]',NULL,NULL,'2026-02-07 03:09:46','2026-02-07 03:09:46'),
(111,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','4a1b587f966aa5cc277f4ed69cfb9c350bf1077c8723c3c537d8fa1e73ac9ffb','[\"*\"]',NULL,NULL,'2026-02-07 03:11:24','2026-02-07 03:11:24'),
(112,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','dc02b620198c308c64c802eefe6a23a898edb18d401be7f98e50bd609fb5ea62','[\"*\"]','2026-02-07 03:21:30',NULL,'2026-02-07 03:12:04','2026-02-07 03:21:30'),
(113,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','1dc7c8b1407773f12cbe23214c29170f336dd740f225b450fe7f2e7867d94431','[\"*\"]','2026-02-07 03:14:59',NULL,'2026-02-07 03:12:14','2026-02-07 03:14:59'),
(114,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','2e70dbef04339af29fcbae120f60db12cecddfeb95077ad0b13a3602be64d9f4','[\"*\"]',NULL,NULL,'2026-02-07 03:12:18','2026-02-07 03:12:18'),
(115,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','34fdc2ab2d27d38358a799fdf15d2dcafa696453106d2c1baf11f7fd3c2a7367','[\"*\"]',NULL,NULL,'2026-02-07 03:12:25','2026-02-07 03:12:25'),
(116,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','2681548bd4ca55aa5dd3b05a6ae4348d25415d7b851fd65ed9f6486175b4cdf7','[\"*\"]','2026-02-07 03:12:52',NULL,'2026-02-07 03:12:29','2026-02-07 03:12:52'),
(117,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','1d1b495adda41b1622c57db7cd0a4809d5d53e41e5f1febacdda536107a214ba','[\"*\"]',NULL,NULL,'2026-02-07 03:12:30','2026-02-07 03:12:30'),
(118,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','c3085766bc8bc15350351307bedbe6d12b9c0a6c38df131d936db43b7a737c2b','[\"*\"]',NULL,NULL,'2026-02-07 03:12:32','2026-02-07 03:12:32'),
(119,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','93d1ea624c13d934b740cd0ba3baf0ff3641fa0cd25f06ea5908ec9c65494556','[\"*\"]','2026-02-07 03:14:29',NULL,'2026-02-07 03:12:36','2026-02-07 03:14:29'),
(120,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','a4a51c31396bb39fcdf06c9a54572557ffaa67119874175a2ac5a5fcf6bc68ac','[\"*\"]',NULL,NULL,'2026-02-07 03:12:37','2026-02-07 03:12:37'),
(121,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','f3890ea552c97f42177ed41d39c64cdb5a8f6bfc41aec01209a31b9e7090a7a5','[\"*\"]','2026-02-07 03:13:23',NULL,'2026-02-07 03:12:44','2026-02-07 03:13:23'),
(122,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','dc5a8d985e6a37314ffb7d25a5b0e6e7e2b14dece375831f9a26b57021727303','[\"*\"]',NULL,NULL,'2026-02-07 03:12:45','2026-02-07 03:12:45'),
(123,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','a879e3389465767b49a90008be105c56e0dbf82ee7530937c572f03594cde5cd','[\"*\"]','2026-02-07 03:16:53',NULL,'2026-02-07 03:12:47','2026-02-07 03:16:53'),
(124,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','b8b35c1f345c1525aa842245f753d940647da5a17116aa61008cb2536585a35a','[\"*\"]','2026-02-07 03:12:55',NULL,'2026-02-07 03:12:49','2026-02-07 03:12:55'),
(125,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','748a7ae8a6cc1cbe36bb7487b7d4957c097ade0b402e14ada5b20a5aa05b91f4','[\"*\"]','2026-02-07 03:15:37',NULL,'2026-02-07 03:12:52','2026-02-07 03:15:37'),
(126,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','23651de090634c570efd6ae3e060aa1f318ee81fc164694d3ebda90503312879','[\"*\"]','2026-02-07 03:14:36',NULL,'2026-02-07 03:12:57','2026-02-07 03:14:36'),
(127,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','8a6141f1c3bda62ff9b6698848cf5478e46f6636752b201807737e7083f78d56','[\"*\"]','2026-02-07 03:17:38',NULL,'2026-02-07 03:13:05','2026-02-07 03:17:38'),
(128,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','7a3aa54353febae0b026cfb4e4833cf50e543d97763a3b8db3061a2955859fa2','[\"*\"]','2026-02-07 03:15:18',NULL,'2026-02-07 03:13:06','2026-02-07 03:15:18'),
(129,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','4e7eeb25f8667211350f4dd0ca6dab11bed1547c4aa9ae6f58dbe1157ad785fe','[\"*\"]','2026-02-07 03:13:48',NULL,'2026-02-07 03:13:21','2026-02-07 03:13:48'),
(130,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','beb6802236b9cffc35e4ae28b3defbd2f20a2a65cefc1e0e6003c240fba244a3','[\"*\"]',NULL,NULL,'2026-02-07 03:13:28','2026-02-07 03:13:28'),
(131,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','815f585ff0bfb4a77fbc27c7b556c06aa0523a5ae79d3d2f0beb39f44c43f337','[\"*\"]','2026-02-07 03:14:58',NULL,'2026-02-07 03:13:29','2026-02-07 03:14:58'),
(132,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','a9d117114a7d9f841409716b33ce6ee6806a8ca0b46757c7d02932c4adc51576','[\"*\"]',NULL,NULL,'2026-02-07 03:13:34','2026-02-07 03:13:34'),
(133,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','3a616c4a5fbd2625429a074244555e201a8e85ddf8431d4fc81cdb9887e5926f','[\"*\"]',NULL,NULL,'2026-02-07 03:13:34','2026-02-07 03:13:34'),
(134,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','38b22943f1636912a5f05234df589fbc6fd42c3ecc0e0070be1b656a94a43a36','[\"*\"]','2026-02-07 03:14:16',NULL,'2026-02-07 03:13:38','2026-02-07 03:14:16'),
(135,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','386ab85cb27179a557f498ba52b72576c3258d8365e836b563cbf3b0dc1a9811','[\"*\"]','2026-02-07 03:15:25',NULL,'2026-02-07 03:13:48','2026-02-07 03:15:25'),
(136,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','276092e0e40b060dbf5f946aa7939e904d2dbcb45d1bb9b5baa4a7450c44b9b3','[\"*\"]','2026-02-07 03:14:08',NULL,'2026-02-07 03:13:52','2026-02-07 03:14:08'),
(137,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','9f3374929d558d9a0ce2e4cf5c9b0726dc3b43fdd0f58331251cd07559eb8e3a','[\"*\"]',NULL,NULL,'2026-02-07 03:14:04','2026-02-07 03:14:04'),
(138,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','25feca8028fcdd00cb749b104ae697de32a7e3116fab15b5487b6812d7678935','[\"*\"]',NULL,NULL,'2026-02-07 03:14:05','2026-02-07 03:14:05'),
(139,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','1a1c76ba567c4ea46204a5aeb963edef1560c9e11cc7ab0188f906c5201adee4','[\"*\"]',NULL,NULL,'2026-02-07 03:14:07','2026-02-07 03:14:07'),
(140,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','2a4ac53f69d1a8bb231181085c58aa6689b43baff0d34d45da54d6c77d8dc2b7','[\"*\"]','2026-02-07 03:16:45',NULL,'2026-02-07 03:14:11','2026-02-07 03:16:45'),
(141,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','35053d612ae3b21dfffb6d4436a208eb893c68694355fe23d3ee16d231c64e38','[\"*\"]','2026-02-07 03:14:44',NULL,'2026-02-07 03:14:20','2026-02-07 03:14:44'),
(142,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','f543892742c75d8e3b988a7ebf0a785824f6d04232ea3748c6c9d106549b0f60','[\"*\"]',NULL,NULL,'2026-02-07 03:14:24','2026-02-07 03:14:24'),
(143,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','4f2fc203ae206e729b500fe2f4a7ce01c2b87ae86a6f74fac1f5c65f387088ca','[\"*\"]','2026-02-07 03:15:01',NULL,'2026-02-07 03:14:27','2026-02-07 03:15:01'),
(144,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','327ab0e3d1af169c8a892bf208ec0f5155d123b4e7d1355ff6e71ff41325f71b','[\"*\"]',NULL,NULL,'2026-02-07 03:14:34','2026-02-07 03:14:34'),
(145,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','53737c52c6acd658e497d8905808457fc31ebfd7aeb6795dd994fc4d972521fa','[\"*\"]','2026-02-07 03:14:55',NULL,'2026-02-07 03:14:41','2026-02-07 03:14:55'),
(146,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','36df9b67b73a4ec26093111f23278b9c9afb96810d5478e77e22bcfb98d9073f','[\"*\"]','2026-02-07 03:15:15',NULL,'2026-02-07 03:14:45','2026-02-07 03:15:15'),
(147,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','f70a9a814c1164eae9745a48bf42bf9a86ebf21d2c4f073902588b03ab3fa553','[\"*\"]',NULL,NULL,'2026-02-07 03:14:49','2026-02-07 03:14:49'),
(148,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','3dfe6c56516a1ba54d29e739199aa1d1a382544bf961bd9f73a5e397c205237c','[\"*\"]',NULL,NULL,'2026-02-07 03:14:54','2026-02-07 03:14:54'),
(149,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','54fd60b9279a35bfb4e0cfdb3052819c150b80443c9e2721cc0990b8dad30df8','[\"*\"]','2026-02-07 03:15:00',NULL,'2026-02-07 03:14:54','2026-02-07 03:15:00'),
(150,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','e83a074216057da724fa72313a3790f373405c164b8011e9acfe801e00715af0','[\"*\"]','2026-02-07 03:48:41',NULL,'2026-02-07 03:14:58','2026-02-07 03:48:41'),
(151,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','b1c8276b211e54138f31bce66f7f22795cf54c5ec48c5e427326b034288a2815','[\"*\"]',NULL,NULL,'2026-02-07 03:15:00','2026-02-07 03:15:00'),
(152,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','ea6f8ef0d8e34289ee79b48cf40382a1b090faca2ba30a9f4b48e769adbd5846','[\"*\"]','2026-02-07 03:16:58',NULL,'2026-02-07 03:15:21','2026-02-07 03:16:58'),
(153,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','572adc3b9480df7682b96ffa12d0ac66097577e0d510df21e386aa9da209a400','[\"*\"]',NULL,NULL,'2026-02-07 03:15:38','2026-02-07 03:15:38'),
(154,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','95daa43a1afaf1108a2548a03c0216c9d250c86d148efbd0674b0c320b803d80','[\"*\"]',NULL,NULL,'2026-02-07 03:15:49','2026-02-07 03:15:49'),
(155,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','1937abc387308eff9eca9a248e703802cd4435ec8d6458260f550b3b8505ac01','[\"*\"]',NULL,NULL,'2026-02-07 03:15:56','2026-02-07 03:15:56'),
(156,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','1b20c0b29b4682ea286f0d0d3a13269c747c1e1708c33ea95f19f8423a7a33d5','[\"*\"]',NULL,NULL,'2026-02-07 03:16:05','2026-02-07 03:16:05'),
(157,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','554df0c7f09aa431816992cdf41cc9cd66af3e47926f6c5d99d897a0d531f58a','[\"*\"]',NULL,NULL,'2026-02-07 03:16:10','2026-02-07 03:16:10'),
(158,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','1e6298cecb1357acefe08d4d796cbfbf4dcfea4239ea0b524066f60bb55e4965','[\"*\"]','2026-02-07 03:16:57',NULL,'2026-02-07 03:16:40','2026-02-07 03:16:57'),
(159,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','74c9eab7b71df2b17e76e5595966a52f68b8f945f15a22a2fbced5ce16bd0867','[\"*\"]','2026-02-07 03:42:41',NULL,'2026-02-07 03:16:43','2026-02-07 03:42:41'),
(160,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','219c755d5e938ffe771b1a7d7f3a050510bdd20f7fcbe624909da9bb09b18b6a','[\"*\"]','2026-02-07 03:18:27',NULL,'2026-02-07 03:17:05','2026-02-07 03:18:27'),
(161,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','ff3251dd0527b94da34e533debacecbe99fd7412b9410a95c270c2ac3e6df5c1','[\"*\"]',NULL,NULL,'2026-02-07 03:17:07','2026-02-07 03:17:07'),
(162,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','9dc9e7d7281cfee43d103716266c830626407475304899057ca6ead94975d48f','[\"*\"]','2026-02-07 03:17:27',NULL,'2026-02-07 03:17:19','2026-02-07 03:17:27'),
(163,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','e48919ef41c6ef0792957c2f3bc5636acf15821eea00e63cc7a7afd8dc2957bf','[\"*\"]',NULL,NULL,'2026-02-07 03:17:43','2026-02-07 03:17:43'),
(164,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','0b6910d05fae781babcabce32440ec41671a25c392d136c1970a7129cfec8eca','[\"*\"]','2026-02-07 03:20:21',NULL,'2026-02-07 03:17:52','2026-02-07 03:20:21'),
(165,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','34ab57b4144975d8febdcfdc7dbf08f6d3643147c07ed4f22884ff03f9ffc9bd','[\"*\"]',NULL,NULL,'2026-02-07 03:18:34','2026-02-07 03:18:34'),
(166,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','048848390d5201ca4cc702410d73710d0bf0e9f63825a00caf443060e7e9bf1d','[\"*\"]',NULL,NULL,'2026-02-07 03:18:35','2026-02-07 03:18:35'),
(167,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','690fed99264e6ca6631a121206eb577ebcdcef9b199a93502b3072194b36e104','[\"*\"]',NULL,NULL,'2026-02-07 03:19:21','2026-02-07 03:19:21'),
(168,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','d543d088c7c884d84903fc69575d796bcb91926cef5c267b9fe1b93c118bcbcc','[\"*\"]',NULL,NULL,'2026-02-07 03:22:08','2026-02-07 03:22:08'),
(169,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','acc3308c1a5bcaac44993318afc366abd9224bd6f123a0c7ab950c7d29c689d3','[\"*\"]',NULL,NULL,'2026-02-07 03:22:14','2026-02-07 03:22:14'),
(170,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','a929d889c26260cf509d1937026a6a8ec42659fa2407317be0a20fc37da76536','[\"*\"]','2026-02-07 03:27:04',NULL,'2026-02-07 03:26:02','2026-02-07 03:27:04'),
(171,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','7891f799e43c68e9e1abd75abcecd9f39f7d209468a44145858e36b4512183c1','[\"*\"]','2026-02-07 03:32:35',NULL,'2026-02-07 03:27:27','2026-02-07 03:32:35'),
(172,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','10fda079b639bc34b9f4b987b430b989dab3fa5ff08e042438aaafa7622780a1','[\"*\"]','2026-02-07 03:29:58',NULL,'2026-02-07 03:29:43','2026-02-07 03:29:58'),
(173,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','838e39eb06ed6f533e2a60553d7e418af9a24905f557872c3542a690cba94f6b','[\"*\"]',NULL,NULL,'2026-02-07 03:36:04','2026-02-07 03:36:04'),
(174,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','847b5e4a16969705049a9e6b34394f375a78b43e69211f1171cc144bca5cb1b2','[\"*\"]','2026-02-07 03:49:08',NULL,'2026-02-07 03:48:59','2026-02-07 03:49:08'),
(175,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','7ae43641c60388924136d2b42f2542b32c1f5b644ef80fd24ffbc6b731abe1ab','[\"*\"]','2026-02-07 03:55:40',NULL,'2026-02-07 03:49:48','2026-02-07 03:55:40'),
(176,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','90896c15e7014cbdaad284422e684841be36e55a7679667142aeb35cce496fc8','[\"*\"]','2026-02-07 05:53:44',NULL,'2026-02-07 05:18:19','2026-02-07 05:53:44'),
(177,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','818349796ee03e870fc5fc58f73530ab2f7332a05a6bf28e8b04d284aeb0e8e4','[\"*\"]','2026-02-07 05:23:40',NULL,'2026-02-07 05:23:07','2026-02-07 05:23:40'),
(178,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','66aba84b07ee70541e05b4b0aa720a55c38753ca088acd2db2420cfbcb8ad962','[\"*\"]',NULL,NULL,'2026-02-09 08:35:40','2026-02-09 08:35:40'),
(179,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','2cc1bac2a72f62b40e021c29e365fee76566dd9e8a067c3ca4b30be50acb4da9','[\"*\"]','2026-02-09 08:36:18',NULL,'2026-02-09 08:36:05','2026-02-09 08:36:18'),
(180,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','1326b4949f923c0b3be25790fad370f3e78c96e154d096b822f8c610a6710c65','[\"*\"]','2026-02-09 08:37:28',NULL,'2026-02-09 08:37:02','2026-02-09 08:37:28'),
(181,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','359dd8a1fcd060aec40ac1d518d1e5f5fc608901592279641c69d795cab9bdaa','[\"*\"]','2026-02-09 08:37:46',NULL,'2026-02-09 08:37:41','2026-02-09 08:37:46'),
(182,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','7383c9f01a1d355b113e81576864953743d86a16451fbeca76d8650956c24ce4','[\"*\"]','2026-02-09 08:38:28',NULL,'2026-02-09 08:38:23','2026-02-09 08:38:28'),
(183,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','c822717e9ab912514473ffa342be3f40531e55d996b52021af81864b1781019b','[\"*\"]','2026-02-09 08:39:23',NULL,'2026-02-09 08:39:17','2026-02-09 08:39:23'),
(184,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','067a9d757585324213d988b7f430c36817edb1098e68b5d5c61c51ad004a11be','[\"*\"]','2026-02-09 08:40:42',NULL,'2026-02-09 08:40:39','2026-02-09 08:40:42'),
(185,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','0ca9dd0551d8b501594a7ed97079ff7bf286f5c3966a25fc49ecf1710eaa944e','[\"*\"]','2026-02-09 09:00:56',NULL,'2026-02-09 08:41:14','2026-02-09 09:00:56'),
(186,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','cd07d85577f456c3ef32d87e5a9c2998a3fc5f91f49ab8a7a645c5200715481d','[\"*\"]','2026-02-09 09:07:08',NULL,'2026-02-09 09:01:30','2026-02-09 09:07:08'),
(187,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','a166dbc9794d7a3461c86c62ebb8f4aec9f2f47d05921166d9c129850690820a','[\"*\"]','2026-02-09 09:07:47',NULL,'2026-02-09 09:07:24','2026-02-09 09:07:47'),
(188,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','443038f63d23cbc65623ac4fd12ddc54c4034861e15708b0ea93c4175818ffca','[\"*\"]','2026-02-09 09:13:15',NULL,'2026-02-09 09:07:54','2026-02-09 09:13:15'),
(189,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','82086e93ad5ed4e084313dfed3f87d61f35af53caa6d49e38e30da9f99a47cf9','[\"*\"]','2026-02-09 09:17:29',NULL,'2026-02-09 09:13:38','2026-02-09 09:17:29'),
(190,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','6d9ac9803c35514f3fd89f61901ba0ea1d551e1f55c05788b3d45509cc4c07c5','[\"*\"]','2026-02-09 09:18:57',NULL,'2026-02-09 09:18:19','2026-02-09 09:18:57'),
(191,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','af46fb829a58575faab4365a234d790feb1be9d1a611f28130343359614b5569','[\"*\"]','2026-02-09 09:19:14',NULL,'2026-02-09 09:18:35','2026-02-09 09:19:14'),
(192,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','d58c1bb38d0e78b85408a63106f5ff4a69509cc7813e0759909a7755187ec822','[\"*\"]','2026-02-09 09:20:06',NULL,'2026-02-09 09:19:01','2026-02-09 09:20:06'),
(193,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','040328dcc64bcfcd80ad569c8c3ff48236bc87707d6a03fa9afc673b10433b94','[\"*\"]','2026-02-09 09:19:29',NULL,'2026-02-09 09:19:21','2026-02-09 09:19:29'),
(194,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','6797e0487248c74b3bcf6143652db585d615bc9900be70b31ad9bc16587e0a3f','[\"*\"]','2026-02-09 09:20:51',NULL,'2026-02-09 09:20:41','2026-02-09 09:20:51'),
(195,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','ceb261da0ae6b6f1ad2aaea0ce2fb68bf9c93b8c75223a844e54f1a735f4a5a2','[\"*\"]','2026-02-09 09:24:30',NULL,'2026-02-09 09:21:03','2026-02-09 09:24:30'),
(196,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','288ec205922858600823afdd23b55d89b197e4b72c8e535419d0a07262b80fce','[\"*\"]','2026-02-09 09:25:45',NULL,'2026-02-09 09:24:53','2026-02-09 09:25:45'),
(197,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','2078bb3dc46bef1159c03ff14e0804e5d6ac88cea5a3800b6a376868d0232a2f','[\"*\"]','2026-02-09 09:26:07',NULL,'2026-02-09 09:25:56','2026-02-09 09:26:07'),
(198,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','fbe596b820a5e6e9ef404c91ea780fbba257d622ae7b400fc33043290dd0febd','[\"*\"]','2026-02-09 09:36:26',NULL,'2026-02-09 09:36:05','2026-02-09 09:36:26'),
(199,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','e75f319d3dcb347e74e44670da5763686c0b00de30dca7a3a7469ddace8dbcab','[\"*\"]','2026-02-09 10:00:19',NULL,'2026-02-09 09:37:46','2026-02-09 10:00:19'),
(200,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','dd9beb2063174d4e663c63f199a95054b6d63d8fb3b9f6eb694afbe2f47ae912','[\"*\"]','2026-02-09 12:15:56',NULL,'2026-02-09 12:15:26','2026-02-09 12:15:56'),
(201,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','65d5321f5877ed46fd72e0a7199ab2cc5a9529d80d6223ade6540c099ec0859a','[\"*\"]','2026-02-09 12:16:20',NULL,'2026-02-09 12:16:11','2026-02-09 12:16:20'),
(202,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','c49f1840d98f24e6e52965183e5817263b91d43f418c72085b700725b716a9d1','[\"*\"]','2026-02-09 12:17:56',NULL,'2026-02-09 12:17:44','2026-02-09 12:17:56'),
(203,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','866a9837a937ef20900bf76901ed4431cd91de3f5d02e78d1efa42bf964d4917','[\"*\"]','2026-02-09 12:19:41',NULL,'2026-02-09 12:18:54','2026-02-09 12:19:41'),
(204,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','f3de1e2536169d0650371aabbe22a824f06d841926c8a91dee7160e28c97b780','[\"*\"]','2026-02-09 12:22:45',NULL,'2026-02-09 12:19:53','2026-02-09 12:22:45'),
(205,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','651c41f67d36756c9e8e364dd57586ba2786814eeb4d7414a287e8578903a337','[\"*\"]','2026-02-09 12:23:06',NULL,'2026-02-09 12:23:00','2026-02-09 12:23:06'),
(206,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','cc8e2c18156434a1f0df1297dd09221ae932827409d6e339e314249b7e459c98','[\"*\"]','2026-02-09 12:24:57',NULL,'2026-02-09 12:23:49','2026-02-09 12:24:57'),
(207,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','1e26700e1fced578e7d6a9ddba662682c2cff40ac8937d2f3c59c548c506f5ba','[\"*\"]','2026-02-09 12:25:37',NULL,'2026-02-09 12:25:12','2026-02-09 12:25:37'),
(208,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','1249aceda66b787c7729a1d179817dcd682ff66c3cb9d1b5a6fed3fd55ff29e4','[\"*\"]','2026-02-09 12:26:26',NULL,'2026-02-09 12:25:53','2026-02-09 12:26:26'),
(209,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde4','auth_token','5a622076f6e5ef16cd61a9edf784bd2ba4ae9da892a6de54060548f31941e0b0','[\"*\"]','2026-02-09 12:26:50',NULL,'2026-02-09 12:26:35','2026-02-09 12:26:50'),
(210,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde5','auth_token','b827cd86d0d6ddd11c4462138ab6d4b1d476d772bb5680dd15c08dae4770c1a9','[\"*\"]','2026-02-09 12:27:07',NULL,'2026-02-09 12:27:00','2026-02-09 12:27:07'),
(211,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','0b82bcef2b16195a3fdf3250d5a187a1aa838a154a96252360823011f77fe18e','[\"*\"]','2026-02-10 00:07:03',NULL,'2026-02-10 00:06:58','2026-02-10 00:07:03'),
(212,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','88ff710086c3ee904983f5e630bbdc3a77923612ca89bb9b9c7b3ac1d16a1e8e','[\"*\"]','2026-02-10 00:20:24',NULL,'2026-02-10 00:07:18','2026-02-10 00:20:24'),
(213,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','3db3366312675e56832ef28fff7408352dc56f71c4bd6efde0ade632918a4b78','[\"*\"]','2026-02-10 00:20:35',NULL,'2026-02-10 00:20:28','2026-02-10 00:20:35'),
(214,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','97d7bdc106209aaa44921ee878812accb9a244019d7a2d895a296dd80de673d9','[\"*\"]','2026-02-10 00:41:49',NULL,'2026-02-10 00:22:08','2026-02-10 00:41:49'),
(215,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','cbe23ce319ec7343964ac97f7684dcdf1f835ee589a4fb5336f23b8875d825ac','[\"*\"]','2026-02-10 00:42:05',NULL,'2026-02-10 00:41:58','2026-02-10 00:42:05'),
(216,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','98e341767bbea4f8f77fde32c32b90ce67290382d36cdf782ce6355768e1be1d','[\"*\"]',NULL,NULL,'2026-02-10 02:55:23','2026-02-10 02:55:23'),
(217,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','b7464fce2da398fabaa3edd7fda80ba5b8cd91c73449bf352bb83f539401cf49','[\"*\"]','2026-02-10 02:59:39',NULL,'2026-02-10 02:55:37','2026-02-10 02:59:39'),
(218,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','788392f3c38742578acb8c3ef799a5dda93ecd27bc2e88f76220603d801d4a09','[\"*\"]','2026-02-10 03:03:47',NULL,'2026-02-10 03:00:09','2026-02-10 03:03:47'),
(219,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','6a16e240d6208187b6d852b8d686ddd6a95475406bf1aba32083bde8285ace7e','[\"*\"]','2026-02-11 03:05:56',NULL,'2026-02-11 03:05:41','2026-02-11 03:05:56'),
(220,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','d16dcbf5ccef5b1249214cbcfddf9b9668d2675fa748c3257725fa6c2dbc8ced','[\"*\"]','2026-02-11 11:30:24',NULL,'2026-02-11 03:52:40','2026-02-11 11:30:24'),
(221,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde2','auth_token','e31e556627ce2edc90071c514bf761a841d90dcab0e35faafc00e39b4e6761cb','[\"*\"]','2026-02-11 03:57:07',NULL,'2026-02-11 03:56:40','2026-02-11 03:57:07'),
(222,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','232e03afa1daf4972a244b543ea90fa87b2812d8feaff33b4e35338717cc8c6d','[\"*\"]','2026-02-11 03:59:08',NULL,'2026-02-11 03:58:28','2026-02-11 03:59:08'),
(223,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','fbc12bb6a1387231269a8e8d2563fc55c83c25f60fe263f498e353e98c2111e2','[\"*\"]','2026-02-11 04:40:14',NULL,'2026-02-11 04:39:31','2026-02-11 04:40:14'),
(224,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','b10b3a480e400a356d2b880c100d1af58083d94c72990f0d0fba92beca673ee7','[\"*\"]','2026-02-11 04:41:00',NULL,'2026-02-11 04:40:34','2026-02-11 04:41:00'),
(225,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','c716ecb37ad96484c7c5adc3ab6060b865c4d00156413b62838ecaeed2aa5523','[\"*\"]','2026-02-11 05:44:11',NULL,'2026-02-11 05:43:51','2026-02-11 05:44:11'),
(226,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','2cb724e116583fa20312bd31a26a0b3deacd34cb82b8cc56c268f40f05bd7a1d','[\"*\"]','2026-02-11 05:44:52',NULL,'2026-02-11 05:44:40','2026-02-11 05:44:52'),
(227,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde3','auth_token','7a4486c48b8905e7cea52f83ba0c9252de53a6a2891bf9638d91033000c478ff','[\"*\"]',NULL,NULL,'2026-02-11 11:30:39','2026-02-11 11:30:39'),
(228,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde0','auth_token','6b8cd606dbc90294962eccbebde8080fb6ec7a8e49b7a3c31279676a7fa2aae8','[\"*\"]','2026-02-21 06:19:59',NULL,'2026-02-21 06:19:49','2026-02-21 06:19:59'),
(229,'App\\Models\\User','a1b2c3d4-e5f6-7890-1234-567890abcde1','auth_token','498dd516bb0ef551e583aede9b0dbd73cd16bee05db61ed0b0069fda523bff07','[\"*\"]','2026-03-04 01:01:06',NULL,'2026-03-04 01:00:17','2026-03-04 01:01:06');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proposal_attachments`
--

DROP TABLE IF EXISTS `proposal_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposal_attachments` (
  `id` char(36) NOT NULL,
  `proposal_id` char(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `proposal_attachments_proposal_id_foreign` (`proposal_id`),
  CONSTRAINT `proposal_attachments_proposal_id_foreign` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proposal_attachments`
--

LOCK TABLES `proposal_attachments` WRITE;
/*!40000 ALTER TABLE `proposal_attachments` DISABLE KEYS */;
INSERT INTO `proposal_attachments` VALUES
('a3b4c5d6-e7f8-9012-3456-234567890123','c3d4e5f6-a7b8-9012-3456-7890abcdef2','Proposal_Pelatihan.pdf','attachments/Proposal_Pelatihan.pdf','2025-12-07 04:16:00'),
('b4c5d6e7-f8a9-0123-4567-345678901234','c3d4e5f6-a7b8-9012-3456-7890abcdef2','Daftar_Peserta.xlsx','attachments/Daftar_Peserta.xlsx','2025-12-07 04:16:00'),
('c9d0e1f2-a3b4-5678-9012-def123456789','a1b2c3d4-e5f6-7890-1234-567890abcdef','RAB_Renovasi_7A.pdf','attachments/RAB_Renovasi_7A.pdf','2025-12-07 04:16:00'),
('d0e1f2a3-b4c5-6789-0123-ef1234567890','a1b2c3d4-e5f6-7890-1234-567890abcdef','TOR_Renovasi.docx','attachments/TOR_Renovasi.docx','2025-12-07 04:16:00'),
('e1f2a3b4-c5d6-7890-1234-f12345678901','b2c3d4e5-f6a7-8901-2345-67890abcdef1','RAB_Proyektor.pdf','attachments/RAB_Proyektor.pdf','2025-12-07 04:16:00'),
('f2a3b4c5-d6e7-8901-2345-123456789012','b2c3d4e5-f6a7-8901-2345-67890abcdef1','Spesifikasi_Teknis.docx','attachments/Spesifikasi_Teknis.docx','2025-12-07 04:16:00');
/*!40000 ALTER TABLE `proposal_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proposals`
--

DROP TABLE IF EXISTS `proposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposals` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `rkam_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `jumlah_pengajuan` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','submitted','verified','approved','rejected','final_approved','payment_processing','completed') DEFAULT 'draft',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `verified_by` char(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejected_by` char(36) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `final_approved_at` timestamp NULL DEFAULT NULL,
  `final_approved_by` char(36) DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `requires_committee_approval` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `proposals_user_id_foreign` (`user_id`),
  KEY `proposals_rkam_id_foreign` (`rkam_id`),
  KEY `proposals_verified_by_foreign` (`verified_by`),
  KEY `proposals_approved_by_foreign` (`approved_by`),
  KEY `proposals_rejected_by_foreign` (`rejected_by`),
  KEY `proposals_final_approved_by_foreign` (`final_approved_by`),
  CONSTRAINT `proposals_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `proposals_final_approved_by_foreign` FOREIGN KEY (`final_approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `proposals_rejected_by_foreign` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `proposals_rkam_id_foreign` FOREIGN KEY (`rkam_id`) REFERENCES `rkam` (`id`),
  CONSTRAINT `proposals_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `proposals_verified_by_foreign` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proposals`
--

LOCK TABLES `proposals` WRITE;
/*!40000 ALTER TABLE `proposals` DISABLE KEYS */;
INSERT INTO `proposals` VALUES
('00325e06-e525-46b2-af15-f708a8800f4f','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c41c8-285d-72e0-a3a4-b3d7ba6dff62','Robotic Indonesia Youth Robotic Asosiasion (IYRA)','lomba Makassar Robotic Fiesta 2025 (MAROF 2025).',5500000.00,'submitted','2026-02-10 00:41:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-10 00:40:53','2026-02-10 00:41:30'),
('0e85b841-ddf4-4017-af97-842bc54cf88c','a1b2c3d4-e5f6-7890-1234-567890abcde0','019af7d9-2537-7055-b297-dc5f7742cbb2','testing by aran','anu',100000000.00,'draft',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2025-12-07 08:08:22','2025-12-07 08:08:22'),
('1aa3d775-4a6f-412f-8958-ebfb6dce457a','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c41a1-ea73-72ad-b5e4-997be63830ef','insentif staf komite','insentif staf komite',3000000.00,'final_approved','2026-02-09 09:18:31','2026-02-09 09:19:15','a1b2c3d4-e5f6-7890-1234-567890abcde2','2026-02-09 09:23:58','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,NULL,NULL,'2026-02-09 09:23:58','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,0,'2026-02-09 09:13:13','2026-02-09 09:23:58'),
('5aa32a9f-031c-4117-9baa-7cd4441832b3','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c4199-f046-739e-8d12-1ef95981e8e0','insentif security / satpam','insentif security / satpam',2000000.00,'final_approved','2026-02-09 09:18:43','2026-02-09 09:19:45','a1b2c3d4-e5f6-7890-1234-567890abcde2','2026-02-09 09:24:13','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,NULL,NULL,'2026-02-09 09:24:13','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,0,'2026-02-09 09:10:49','2026-02-09 09:24:13'),
('5b54c6e1-4743-474e-856a-32ac11e75a5a','a1b2c3d4-e5f6-7890-1234-567890abcde1','0c01290a-a492-4c87-81fb-2bc83a669990','dasas;k ; ;lk;l as;ld n','dopasnxn aslkjans dck',50000000.00,'completed','2025-12-29 03:27:16','2025-12-29 03:27:40','a1b2c3d4-e5f6-7890-1234-567890abcde2','2025-12-29 03:28:02','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,NULL,NULL,'2025-12-29 03:28:02','a1b2c3d4-e5f6-7890-1234-567890abcde3','2025-12-29 04:14:45',0,'2025-12-29 03:27:05','2025-12-29 04:14:45'),
('62a3566a-5cbc-4249-8be0-3594c4f8c60c','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c419a-7d6d-7113-a475-1171a005b8da','insentif penjaga malam','insentif penjaga malam',1000000.00,'final_approved','2026-02-09 09:18:38','2026-02-09 09:19:36','a1b2c3d4-e5f6-7890-1234-567890abcde2','2026-02-09 09:24:06','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,NULL,NULL,'2026-02-09 09:24:06','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,0,'2026-02-09 09:11:35','2026-02-09 09:24:06'),
('7035c49f-2df9-40b4-8c79-f4a75eb4b69d','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c4192-2175-7298-9ad7-0a6d737f033a','Insentif Guru Non-ASN','honor GTT januari 2026',18375000.00,'final_approved','2026-02-09 09:18:57','2026-02-09 09:20:02','a1b2c3d4-e5f6-7890-1234-567890abcde2','2026-02-09 09:24:30','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,NULL,NULL,'2026-02-09 09:24:30','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,0,'2026-02-09 09:07:06','2026-02-09 09:24:30'),
('748cf2a6-2aef-4a50-a52d-3d0bc7ad9455','a1b2c3d4-e5f6-7890-1234-567890abcde1','7f8e4389-d3e7-4f01-8b65-d5bed31ce05b','Testing infra proposal','ldkma;lk a;lcna;ldskn',400000000.00,'completed','2025-12-29 03:22:36','2025-12-29 03:23:00','a1b2c3d4-e5f6-7890-1234-567890abcde2','2025-12-29 03:23:24','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,NULL,NULL,'2025-12-29 03:25:25','a1b2c3d4-e5f6-7890-1234-567890abcde5','2025-12-29 04:41:20',1,'2025-12-29 03:22:29','2025-12-29 04:41:20'),
('7b8b6bcb-a524-4f2b-aaae-adcc215f88e3','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c41c8-285d-72e0-a3a4-b3d7ba6dff62','invitasi bola basket zion cup vol.VII yayasan bukit zion','lomba bola basket',2920000.00,'submitted','2026-02-10 00:41:47',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-10 00:20:22','2026-02-10 00:41:47'),
('83f1a3e0-4a1a-4846-a197-f88cf0b8177c','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c4199-74af-7221-b5cb-61024f09eee5','insentif cleaning servis / petugas kebersihan','insentif cleaning servis / petugas kebersihan',6300000.00,'final_approved','2026-02-09 09:18:50','2026-02-09 09:19:55','a1b2c3d4-e5f6-7890-1234-567890abcde2','2026-02-09 09:24:22','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,NULL,NULL,'2026-02-09 09:24:22','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,0,'2026-02-09 09:09:49','2026-02-09 09:24:22'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef','a1b2c3d4-e5f6-7890-1234-567890abcde1','019af706-0e71-738b-a8de-02a8ec492052','Renovasi Ruang Kelas 7A','Renovasi ruang kelas 7A meliputi pengecatan ulang, perbaikan jendela, dan penggantian lantai yang rusak.',15000000.00,'submitted','2025-01-15 00:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2025-12-07 04:16:00',NULL),
('b2c3d4e5-f6a7-8901-2345-67890abcdef1','a1b2c3d4-e5f6-7890-1234-567890abcde1','019af706-0e75-7068-9914-8d3d9591b37b','Pengadaan Proyektor untuk Lab','Pengadaan 2 unit proyektor untuk laboratorium komputer guna mendukung pembelajaran digital.',8500000.00,'submitted','2025-01-14 00:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2025-12-07 04:16:00',NULL),
('b4232419-a132-4a5b-8571-e17833e13e3d','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c41c8-285d-72e0-a3a4-b3d7ba6dff62','invitasi bola basket rajawali cup vol.X SMA katolik rajawali','lomba basket',1660000.00,'submitted','2026-02-10 00:41:40',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-10 00:26:34','2026-02-10 00:41:40'),
('c3d4e5f6-a7b8-9012-3456-7890abcdef2','a1b2c3d4-e5f6-7890-1234-567890abcde1','019af706-0e77-71d7-ac96-fbb5b1611707','Program Pelatihan Guru','Program pelatihan guru dalam penggunaan teknologi digital untuk pembelajaran.',12000000.00,'submitted','2025-01-13 00:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2025-12-07 04:16:00',NULL),
('ca53faa2-c892-46a7-81e0-8f8f62da6a02','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c4257-dfa2-7030-a8e9-e24b4f814ff7','isra miraj','isra miraj',17000000.00,'final_approved','2026-02-09 12:24:56','2026-02-09 12:25:37','a1b2c3d4-e5f6-7890-1234-567890abcde2','2026-02-09 12:26:25','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,NULL,NULL,'2026-02-09 12:26:25','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,0,'2026-02-09 12:22:09','2026-02-09 12:26:25'),
('dde75486-49eb-4ed9-ac17-8dad4fa7ac41','a1b2c3d4-e5f6-7890-1234-567890abcde1','019af706-0e79-701e-98f1-42a832aa4746','coba2','pembimbingan IT',10000000.00,'draft',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-07 03:20:32','2026-02-07 03:20:32'),
('e4c37a41-6941-4ffa-915d-8547f9fc97d6','a1b2c3d4-e5f6-7890-1234-567890abcde1','019c41c8-285d-72e0-a3a4-b3d7ba6dff62','lomba ISS fisika indonesia','lomba olimpiade fisika indonesia (OFI) semifinal bandung\ndengan tema \"membangun generasi unggul melalui prestasi fisika\"',18400000.00,'submitted','2026-02-10 00:41:35',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-02-10 00:38:08','2026-02-10 00:41:35'),
('f24b4614-5ccf-4a51-8203-bea515c834b7','a1b2c3d4-e5f6-7890-1234-567890abcde1','019af7d9-2537-7055-b297-dc5f7742cbb2','testing lagi','dlksmdlkm',100000000.00,'approved','2025-12-07 08:09:44','2025-12-07 08:10:16','a1b2c3d4-e5f6-7890-1234-567890abcde2','2025-12-07 08:12:56','a1b2c3d4-e5f6-7890-1234-567890abcde3',NULL,NULL,NULL,NULL,NULL,NULL,1,'2025-12-07 08:09:32','2025-12-07 08:12:56');
/*!40000 ALTER TABLE `proposals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rkam`
--

DROP TABLE IF EXISTS `rkam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rkam` (
  `id` char(36) NOT NULL,
  `kategori` varchar(255) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `pagu` decimal(15,2) NOT NULL,
  `tahun_anggaran` int(11) NOT NULL DEFAULT 2025,
  `deskripsi` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rkam`
--

LOCK TABLES `rkam` WRITE;
/*!40000 ALTER TABLE `rkam` DISABLE KEYS */;
INSERT INTO `rkam` VALUES
('009ce71c-9dcf-485e-bb46-8552682d23d8','Jariah - Infrastruktur','Pengganttian kanopi gedung kantor dan UKS',27600000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('019af706-0e71-738b-a8de-02a8ec492052','Renovasi','Renovasi Gedung Sekolah',50000000.00,2025,'Renovasi gedung utama termasuk atap dan lantai','2025-12-07 04:16:00','2025-12-07 04:16:00'),
('019af706-0e75-7068-9914-8d3d9591b37b','Pengadaan','Pengadaan Proyektor',20000000.00,2025,'Pengadaan proyektor untuk setiap kelas','2025-12-07 04:16:00','2025-12-07 04:16:00'),
('019af706-0e77-71d7-ac96-fbb5b1611707','Pelatihan','Pelatihan Guru',15000000.00,2025,'Pelatihan metode mengajar modern untuk semua guru','2025-12-07 04:16:00','2025-12-07 04:16:00'),
('019af706-0e79-701e-98f1-42a832aa4746','Pengadaan','Pengadaan Komputer Lab',75000000.00,2025,'Pengadaan 30 unit komputer untuk laboratorium komputer','2025-12-07 04:16:00','2025-12-07 04:16:00'),
('019af706-0e7b-7138-8524-4989956c2db9','Renovasi','Perbaikan Sanitasi',25000000.00,2025,'Perbaikan toilet dan sistem sanitasi sekolah','2025-12-07 04:16:00','2025-12-07 04:16:00'),
('019af706-0e7c-7291-ac08-5a239766612a','Operasional','Operasional Bulanan',30000000.00,2025,'Biaya operasional rutin sekolah','2025-12-07 04:16:00','2025-12-07 04:16:00'),
('019af7d9-2537-7055-b297-dc5f7742cbb2','Renovasi','Testing',100000000.00,2025,'dadasax','2025-12-07 08:06:34','2025-12-07 08:06:34'),
('019c4192-2175-7298-9ad7-0a6d737f033a','Operasional','Insentif Guru Non-ASN',350000000.00,2026,NULL,'2026-02-09 08:43:41','2026-02-09 08:44:54'),
('019c4199-74af-7221-b5cb-61024f09eee5','Operasional','insentif Cleaning servis',11600000000.00,2026,NULL,'2026-02-09 08:51:41','2026-02-09 08:51:41'),
('019c4199-f046-739e-8d12-1ef95981e8e0','Operasional','Insentif Security',3300000000.00,2026,NULL,'2026-02-09 08:52:13','2026-02-09 08:52:13'),
('019c419a-7d6d-7113-a475-1171a005b8da','Operasional','Insentif Penjaga Malam',2400000000.00,2026,NULL,'2026-02-09 08:52:49','2026-02-09 08:52:49'),
('019c419a-e045-70b9-8d2d-d15866cc746b','Operasional','Insentif Bujang Madrasah',1200000000.00,2026,NULL,'2026-02-09 08:53:14','2026-02-09 08:53:14'),
('019c419b-2c71-71ba-901b-1dce51d7e135','Operasional','Insentif Kebersihan PSBB & Boga',2400000000.00,2026,NULL,'2026-02-09 08:53:34','2026-02-09 08:53:34'),
('019c419b-851a-72ca-9768-2fa39c1b8971','Operasional','Apresiasi Kinerja PTT, Cleaning & security',8640000000.00,2026,NULL,'2026-02-09 08:53:57','2026-02-09 08:53:57'),
('019c41a0-17ec-7296-aa0c-c30090167e6f','Operasional','Apresiasi Kinerja bantuan tim kerja sarana',480000000.00,2026,NULL,'2026-02-09 08:58:56','2026-02-09 08:58:56'),
('019c41a1-ea73-72ad-b5e4-997be63830ef','Operasional','Transport Wakil Sekertaris dan Wakil Bendahara',36000000.00,2026,NULL,'2026-02-09 09:00:56','2026-02-09 09:00:56'),
('019c41c8-285d-72e0-a3a4-b3d7ba6dff62','Operasional','Lomba-Lomba Bidang Studi',160000000.00,2026,'lomba','2026-02-09 09:42:42','2026-02-09 09:43:12'),
('019c4257-dfa2-7030-a8e9-e24b4f814ff7','Operasional','isra miraj',17000000.00,2026,NULL,'2026-02-09 12:19:41','2026-02-09 12:19:41'),
('04a14d2e-e0cc-4e61-b39d-4fff8733a63c','Sarana & Prasarana','Biaya Perbaikan Mesin Fotocopy',9305000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('0c01290a-a492-4c87-81fb-2bc83a669990','Jariah - Infrastruktur','Pemeliharaan dan Peningkatan Kualitas CCTV Ruang Pembelajaran',180000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('0c0748ef-13cd-47f6-8538-45ced9cc940c','Sarana & Prasarana','Biaya Perbaikan Mesin Riso',2000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('0c3efc17-8adf-44d1-9503-76ad79ad72db','Jariah - Infrastruktur','Pengadaan kawat pengaman pagar pembatas dengan Mts dan BPSDM Propinsi',9000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('0c8ba025-b745-4b67-a68d-be96208588a9','Sarana & Prasarana','Pemeliharaan roda, rel pintu pagar dan plat jembatan',2500000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('0f507264-027d-47d0-bea7-b097ecf91123','Sarana & Prasarana','Pembersihan sedimen got dan pengangkutan',5000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('0f66040a-a5a1-41f8-b01e-2a3bc1337fe3','Sarana & Prasarana','Perbaikan meubilair ruang guru dan kantor',7225000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('134135b4-a07a-426c-8de4-1e0a403a9603','Sarana & Prasarana','Pemeliharaan Pintu Toilet',6000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('14576a3d-8e61-4b24-8dcb-132f3c7f8b95','Jariah - Infrastruktur','Perbaikan paving blok  area kelas XII IPS 3 dan IPS 4 (5 x 9 meter)',9000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('1656bd5c-284d-4b9b-ac34-e283c8fa1e9f','Sarana & Prasarana','Biaya Pengecatan Gedung Madrasah',30000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('16699890-e274-4c94-8608-229c38d813d5','Sarana & Prasarana','Jasa layanan sound system Indoor',12000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('1a6ccecc-89bd-432a-aefb-06a89c27d544','Sarana & Prasarana','Pemeliharaan AC',8540000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('1fb19df2-894f-4f95-9747-cf7ea4a9960d','Sarana & Prasarana','Penggantian plafon 2 kamar asrama putri',13000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('21a08b60-dc0a-45ae-b858-9f489ceffa4f','Jariah - Infrastruktur','Door closer pintu ruang ber AC',10000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('2af5c294-c128-4ad3-9b75-58de320e4891','Sarana & Prasarana','Pemeliharaan Atap Gedung Smart Class dan Smar Library',92000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('2e0807c9-4b6b-4aa3-972e-f15f6c20c2ae','Sarana & Prasarana','Perbaikan meubilair kelas',13200000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('33f091f1-dd08-4995-9509-27752ea5edce','Sarana & Prasarana','Pemeliharaan Ruang Olahraga dan Laboratorium IPA',40000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('341a1c49-f6b3-4e5d-8279-b20619cb1317','Sarana & Prasarana','Perbaikan engsel dan kunci pintu',10800000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('374b7719-a45c-45ef-92b1-b989463e1f84','Sarana & Prasarana','Perbaikan atap & kanopi gedung',10500000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('399df147-59d5-42d4-8710-010a7d43c586','Jariah - Infrastruktur','Perbaikan dan pembenahan area depan kantor dan ruang pelayanan PTSP',378150000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('3ee95b93-fefe-4699-8f88-a99683cc3e26','Jariah - Infrastruktur','Pengadaan mesin bor dan gurinda',4000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('408321c3-5be3-4896-96b9-bd6e2269e9ad','Kurikulum','Pengadaan Pendingin Udara (AC) Ruang Kelas Kapasitas 2 PK + Instalasi',8700000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Infak Komite','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('40b9a193-494f-4c64-a2c2-801c7e3ca8c1','Jariah - Infrastruktur','Pengadaan Sound System',40850000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('4819367e-6776-4496-a5f4-813ac86ad40a','Jariah - Infrastruktur','Penggantian kabel utama dari antar panel',7500000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('4a1a17af-67fd-4788-8ebb-ff53b75d2c16','Jariah - Infrastruktur','Pembenahan gudang tertutup madrasah beserta rak besi 5 x8 m',8000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('4a86d5aa-e443-437e-a0c9-80118b055aab','Jariah - Infrastruktur','Pembangunan pintu gerbang Alauddin',120000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('4c20b991-9e0d-467e-8d3a-69dfb06467a0','Sarana & Prasarana','Perbaikan sanitasi dan westafel',4500000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('51352e0c-c1b5-44c8-8474-9ac202278618','Sarana & Prasarana','Penggantian kanopi kelas 36 m x 1,6 m (Gedung C)',21750000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('5380aa30-84e6-4f3a-81ad-b0fc6589a973','Sarana & Prasarana','Perbaikan sanitasi dan westafel',5000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('550ef75a-5c7e-494d-86a3-302fe676ece9','Sarana & Prasarana','Apresiasi Kinerja bantuan tim kerja sarana',4800000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('58b583f7-d12e-4e14-b03e-7c68569c7357','Sarana & Prasarana','Penggantian hurup papan nama madrasah area kolam',7500000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('5c17790b-0470-4c5f-ba75-6d25bc6b1a2e','Jariah - Infrastruktur','Pemeliharaan Gedung MAN 2 Kota Makassar',184930000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('5c6a8a1a-7f9d-46e0-816c-669f7cedd5eb','Sarana & Prasarana','Perbaikan dan pengecetan meja dan kursi',32000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('5f7e23c2-761c-489f-8ccb-aee2623e8919','Sarana & Prasarana','Perbaikan AC kelas',9000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('64c7ee25-a9ef-48a8-ac3d-be3f84facef7','Jariah - Infrastruktur','Pengadaan seragam cleaning service',8550000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('65f7837f-2039-40d7-ad83-5cdad90e0120','Jariah - Infrastruktur','Pembuatan WC',150000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('66e524e3-1455-49cd-8d3c-1b04e2be0314','Jariah - Infrastruktur','Pengadaan Kursi + Meja Siswa (Setara Informa)',192000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('6a4f1db4-6be7-4cba-bbf7-2e04bfdbacd2','Jariah - Infrastruktur','Penggantian bahlon lampu kelas (2 bh dari 4, dari  72 kls) beserta teras kelas 8 gedung x 4',12600000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('6e1dc480-945d-40e4-8767-db976515c617','Kurikulum','Bimbingan Belajar Tes Kemampauan Akademik (TKA) Siswa Kelas XII',300000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Infak Komite','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('6fe0cece-4c7d-4e8e-b82d-c3f54700bb85','Jariah - Infrastruktur','pembuatan ruangan ekskul man 2',148500000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('6fe10871-cb51-4a72-8fd5-def41e1da510','Jariah - Infrastruktur','Pengadaan sumur bor, pipa, mesin, dan tandon',6500000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('733ef3dc-db3f-4985-a513-d3916f12b7c0','Jariah - Infrastruktur','Pengecetan karatan rangka atap  indoor',21000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('73d4d949-3e32-4b50-84b2-e899c7780a3d','Sarana & Prasarana','Pembelian Kursi Siswa',60000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('78647a75-1116-498b-82cc-ecdef1c0b082','Sarana & Prasarana','Pemeliharaan Personal Computer/Notebook',5000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('7f8e4389-d3e7-4f01-8b65-d5bed31ce05b','Jariah - Infrastruktur','Renovasi Ruang PTSP, Fasad, Mobiler dan Kelengkapan Penunjang',627070000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('8049cd0b-c2dc-4fd5-bdd3-b01ab19ce846','Sarana & Prasarana','Perbaikan pintu gedung',5000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('855061c0-1cf0-4f07-a4cc-c2a4958fb1c9','Jariah - Infrastruktur','Pemeliharaan Kelistrikan, Elektrikal Pembelajaran, Penggantian Lampu dan Jasa Teknisi',50000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('888a5a54-3c39-4e2c-8b49-9a0ad52a1102','Sarana & Prasarana','Mainenance AC kantor dan ruang guru',4687500.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('8cd90316-dfe0-4dcd-a43b-31e79d3ca8c2','Sarana & Prasarana','Perbaikan Atap Bocor Gedung C',3500000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('9263fbc6-0a19-420d-9502-c0716cd96f02','Jariah - Infrastruktur','Pengadaan dan Pemeliharaan Toilet',160000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('96136c1c-048d-4fd3-97d1-0ef9e4fa21d2','Sarana & Prasarana','Pemeliharaan penerangan taman',3000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('96b496b3-5eb1-4aec-87b7-effec15ece5c','Sarana & Prasarana','Biaya oporasional pembersihan kolam air terjun',4800000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('992c76e0-53ca-45c9-8049-2f301169cde2','Sarana & Prasarana','Pemeliharaan kran air asrama dan wisma',3200000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('a38afba0-7461-4479-b9e8-3e656971e334','Jariah - Infrastruktur','pengadaan PC untuk PTSP dan IT center',42500000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('a6abbe40-6295-4388-9ef5-75f9b84806f7','Jariah - Infrastruktur','Pemasangan kabel jaringan  listrik LCD proyektor untuk kemudahan kontrol',15300000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('a7f339e9-df9a-494b-b36b-d5acd5f78874','Sarana & Prasarana','Cuci AC 4 kali setahun x 137 unit',41100000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('acc35636-1714-4401-9dd2-40ed948ee72d','Sarana & Prasarana','Biaya Perbaikan Instalasi CCTV',9600000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('ade2844a-250e-4ff2-a339-d4e3d9dbd1d1','Jariah - Infrastruktur','Praktek pengadaan panel surya untuk sains',60000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('af1e667d-3af3-4bd7-a201-3eff38380f25','Jariah - Infrastruktur','Penggantian kabel HDMI LCD kelas 12 meter/bh.',7000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('b27b1f9c-8d93-4668-9323-9e62f909de08','Sarana & Prasarana','Lampu Ruangan',9000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('b556ba4f-39b6-4176-9db5-3fc7fbc612cf','Sarana & Prasarana','Biaya Perbaikan AC',8640000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('b6a519b9-aa5f-4ef5-bcd0-7f3cf89cce7f','Sarana & Prasarana','Pembelian Meja Siswa',60000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('bae815b3-8e86-40c0-8859-556d3ff68d58','Sarana & Prasarana','Perbaikan pintu pagar',5000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('bc1d84e6-ef8a-4b53-9331-4515bd851115','Jariah - Infrastruktur','Pengadaan gudang penyimpanan meubilair',7500000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('c0a85b14-d857-4c11-a987-4e06312bc797','Jariah - Infrastruktur','Pengecatan Bangunan/Gedung dan Mesjid',75000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('c4dcb587-d337-484a-ad6a-5dc2caeae415','Sarana & Prasarana','Pengadaan alat penyemprot/pengasapan nyamuk',2500000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('c529372b-cc64-4347-a3f0-a539439ece3d','Sarana & Prasarana','Maintenance Listrik dan lampu',10000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('c6afa413-d8bc-44ca-a86d-fefe72458fce','Jariah - Infrastruktur','Pengadaan Pendingin Udara (AC) Ruang Kelas Kapasitas 2 PK + Instalasi (setara Daikin)',104400000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('cbef57a0-6fdd-41ce-b6e7-9b84a6304ff0','Jariah - Infrastruktur','Pemasangan penghalang panas plafond kls 3 kelas',7500000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('cda489ff-f54d-453e-9c09-d74ca6f79bb2','Sarana & Prasarana','Pengecetan dan pengadaan pintu sekat gedung',1600000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('d723bd34-44f7-48fd-9d4d-d5e78c759983','Sarana & Prasarana','pengadaan tandon',5000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('d81221f7-9004-4f2a-9f9f-00a2b8cdb091','Sarana & Prasarana','Biaya Cuci AC',6300000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('d85409ab-f7d9-4f95-aa6f-657fa1e37e6a','Jariah - Infrastruktur','Pembuatan plat beton di atas ruang OSIM 10 x 10',240000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('d8e88f0b-5987-4396-9299-2a33c057f585','Sarana & Prasarana','Perbaikan atap kelas',5000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('d9686bd1-d2ec-4b4b-b473-a0a3c628a401','Sarana & Prasarana','Pembersihan tandon air',2000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('dc154cce-bee6-4521-a0dc-fe18957d365d','Sarana & Prasarana','Perbaikan kelistrikan',5000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('dc283d0c-f76e-4a53-8f71-7801bf5ca77f','Jariah - Infrastruktur','Pengadaan CCTV',180000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('ded839c7-b5af-4799-8ece-8caa38e0cff0','Sarana & Prasarana','Jasa Pemangkasan dan pengangkutan ranting',9000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('df5afb2b-2cd0-4709-aaeb-a41aec09b5ae','Kurikulum','Pemeliharaan Gedung Madrasah',107352500.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Infak Komite','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('e3986e36-c5d5-4f30-b6fd-89ad2aba5a27','Sarana & Prasarana','Maintenace  CCTV',8000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('e5646de0-79f7-4fc5-b74e-de35b8c5bb67','Sarana & Prasarana','Jasa pengangkutan sampah',6000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('ee5494cc-c77f-4667-885f-a1714a9bd165','Sarana & Prasarana','Perbaikan bangku panjang  depan kelas',5250000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('ee914360-a5ce-42fd-9efd-70265bd9820f','Sarana & Prasarana','Perbaikan plat beton asrama dan gapura',5100000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('f04877e9-0adf-4267-bef3-7f40d37958ec','Jariah - Infrastruktur','Mimbar Aula (diganti menjadi sound system aula PSBB)',40850000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('f78ba953-8aeb-4f66-9ab1-395dda4c79b4','Sarana & Prasarana','Perbaikan toilet',90000000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('f87fe4c5-c175-46e3-88e6-13b2b2f8a820','Sarana & Prasarana','Perbaikan saringan dan pipa pembuangan air',1250000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('fcfc61da-5f0a-4a4c-89fc-56ba1ab75a70','Sarana & Prasarana','Perbaikan lampu asrama',3750000.00,2025,'RKAM TA 2025 - Sarana Prasarana','2025-12-07 16:27:19','2025-12-07 16:27:19'),
('fd17cc37-a2b4-4b4b-a3a3-a100f799ee03','Jariah - Infrastruktur','Biaya pengadaan seragam sequrity',3000000.00,2025,'RKAM Perubahan/Revisi TA 2025 - Dana Jariah','2025-12-07 16:27:19','2025-12-07 16:27:19');
/*!40000 ALTER TABLE `rkam` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES
('9BoULC7HwMKghpgFuFhBQtqogBvUFk8f43yLpxiR',NULL,'180.251.149.7','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiUTVXMzEwQlNJczMzQUYyWkx1R1NjVnJyT216Q0dlU1F4blVzRGFDNiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHBzOi8vYXBpLnNpcmFuZ2t1bC5vbmxpbmUiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1772625733),
('Hiecb3tLlG8tZcOE1eXzK0BfFAGH0PfpOOZwSeLP',NULL,'208.84.101.66','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiVE5MVXRUdWNIbnhxYXZpdVdNbGZKZlU4M3RoUjQyMXhPS3dJQ0pyNCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHBzOi8vYXBpLnNpcmFuZ2t1bC5vbmxpbmUiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1772555631),
('i5fZkKmE3kUsMx9aFhDF53dlcD7LWfHzTADjHcKb',NULL,'194.164.107.4','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoidnJBd1dLd1JzemFWUmNnN0l0NmlVOGh2cHI1YUhRVXhKd0doT2QxUyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHBzOi8vYXBpLnNpcmFuZ2t1bC5vbmxpbmUiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1772606550),
('JlPfIX3GHypYMAciOjMOuTuozkAAdfa2m52hiHHf',NULL,'74.7.243.232','Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.3; +https://openai.com/gptbot)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNnBqbjZBZ1l3amVkSm5IQ3I0YnNEZTRvUER6ejJiV3VEZHJONU1VRCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHBzOi8vYXBpLnNpcmFuZ2t1bC5vbmxpbmUiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1772616375),
('NIZS2o9kqGvQHftjYOsZEl9DeLsvW5IkCvM06jmL',NULL,'34.28.176.220','Mozilla/5.0 (compatible; CMS-Checker/1.0; +https://example.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiU2hta0w4cUxieG5IT2N5emxEUUJFR2hCVVJMeU9INVczaXZPZE5iaiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHBzOi8vYXBpLnNpcmFuZ2t1bC5vbmxpbmUiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1772555163);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `role` enum('administrator','pengusul','verifikator','kepala_madrasah','bendahara','komite_madrasah') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcde0','admin@sirangkul.com','$2y$12$ZMbWyjy9vCykyrB41N6gGelFpzvM4x2yTxQu32/YAc9DTh.TTJxbW','Administrator','administrator',NULL,NULL,'Active'),
('a1b2c3d4-e5f6-7890-1234-567890abcde1','ahmad@madrasah.com','$2y$12$EblWyRv.Rn8k2ybM2dgGHORjz1npD7tMkkoK1CxlPqoUW3.V.egvu','Ahmad','pengusul',NULL,NULL,'Active'),
('a1b2c3d4-e5f6-7890-1234-567890abcde2','siti@madrasah.com','$2y$12$qcX3t14Cl8xx5/Z.rPwjOu8xUh17lUDrLyXhDAwPTDhFQujljzh3O','Siti','verifikator',NULL,NULL,'Active'),
('a1b2c3d4-e5f6-7890-1234-567890abcde3','kepala@madrasah.com','$2y$12$XnweB9wCldp1bXoqA.BITe1gBaaqwGlD5MtCWQCiMyNLtr87xEVXK','Kepala Madrasah','kepala_madrasah',NULL,NULL,'Active'),
('a1b2c3d4-e5f6-7890-1234-567890abcde4','bendahara@madrasah.com','$2y$12$c8YpWUPSSr/O4b2qcCI2WunjD6ppLgZuBRGGfRqpO20GrOXl9dxZa','Bendahara','bendahara',NULL,NULL,'Active'),
('a1b2c3d4-e5f6-7890-1234-567890abcde5','komite@madrasah.com','$2y$12$tE0HMEDOddgkol92sCk4/.PjYIBYqSymaeL/ihPMdWGqE/IbWGpq2','H. Abdullah','komite_madrasah',NULL,NULL,'Active');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-04 12:16:02
