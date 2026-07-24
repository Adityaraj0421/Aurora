CREATE TABLE `requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`owner` text DEFAULT 'Aurora London team' NOT NULL,
	`guests` text DEFAULT 'Aditya + Maya' NOT NULL,
	`plan_json` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `requests_reference_unique` ON `requests` (`reference`);
--> statement-breakpoint
INSERT INTO `requests` (`reference`, `title`, `status`, `owner`, `guests`, `plan_json`, `note`)
VALUES (
	'AUR-2417',
	'Dinner, then the late set.',
	'requested',
	'Aurora London team',
	'Aditya + Maya',
	'[{"time":"8:15 PM","title":"Mountain","detail":"Table for two · checked at 18:42 · not held","state":"checked"},{"time":"10:30 PM","title":"Ronnie Scott''s","detail":"Late set · custom access request required","state":"request"},{"time":"After","title":"Car to your hotel","detail":"Added after both stops are confirmed","state":"dependent"}]',
	'Quiet table if possible. No shellfish.'
);
