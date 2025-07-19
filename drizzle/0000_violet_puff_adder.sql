CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"clerk_id" text,
	"role" text DEFAULT 'admin',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "adoptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"bamboo_plant_id" integer,
	"package_id" integer,
	"package_name" text,
	"package_price" text,
	"package_period" text,
	"package_features" text,
	"location_id" integer,
	"location_name" text,
	"adoption_date" timestamp DEFAULT now(),
	"adoption_price" text,
	"is_active" boolean DEFAULT true,
	"certificate_issued" boolean DEFAULT false,
	"payment_reference_no" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "adoptions_payment_reference_no_unique" UNIQUE("payment_reference_no")
);
--> statement-breakpoint
CREATE TABLE "bamboo_plants" (
	"id" serial PRIMARY KEY NOT NULL,
	"plant_code" text NOT NULL,
	"location" text NOT NULL,
	"planted_date" timestamp NOT NULL,
	"current_height" numeric(5, 2),
	"species" text DEFAULT 'Bambusa vulgaris',
	"status" text DEFAULT 'growing',
	"co2_absorbed" numeric(8, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bamboo_plants_plant_code_unique" UNIQUE("plant_code")
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"adoption_id" integer,
	"certificate_number" text NOT NULL,
	"issue_date" timestamp DEFAULT now(),
	"qr_code" text,
	"nfc_data" text,
	"pdf_url" text,
	"is_valid" boolean DEFAULT true,
	CONSTRAINT "certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "environmental_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"bamboo_plant_id" integer,
	"soil_moisture" numeric(5, 2),
	"soil_ph" numeric(3, 1),
	"temperature" numeric(4, 1),
	"humidity" numeric(5, 2),
	"sunlight_hours" numeric(4, 2),
	"rainfall" numeric(6, 2),
	"recorded_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "growth_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"bamboo_plant_id" integer,
	"height" numeric(5, 2) NOT NULL,
	"diameter" numeric(4, 2),
	"notes" text,
	"photo_url" text,
	"recorded_date" timestamp DEFAULT now(),
	"recorded_by" text
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"latitude" text,
	"longitude" text,
	"description" text,
	"capacity" integer,
	"current_count" integer DEFAULT 0,
	"soil_type" text,
	"area_condition" text,
	"features" text,
	"image" text,
	"coordinates" text,
	"availability" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" text NOT NULL,
	"period" text NOT NULL,
	"features" text,
	"planting_location_id" integer,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_no" text NOT NULL,
	"user_id" text NOT NULL,
	"amount" text NOT NULL,
	"description" text,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"package_type" text,
	"location_id" text,
	"location_name" text,
	"status" text DEFAULT 'pending',
	"gateway" text DEFAULT 'toyyibpay',
	"bill_code" text,
	"transaction_id" text,
	"paid_amount" text,
	"paid_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_reference_no_unique" UNIQUE("reference_no")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_bamboo_plant_id_bamboo_plants_id_fk" FOREIGN KEY ("bamboo_plant_id") REFERENCES "public"."bamboo_plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_adoption_id_adoptions_id_fk" FOREIGN KEY ("adoption_id") REFERENCES "public"."adoptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environmental_data" ADD CONSTRAINT "environmental_data_bamboo_plant_id_bamboo_plants_id_fk" FOREIGN KEY ("bamboo_plant_id") REFERENCES "public"."bamboo_plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_tracking" ADD CONSTRAINT "growth_tracking_bamboo_plant_id_bamboo_plants_id_fk" FOREIGN KEY ("bamboo_plant_id") REFERENCES "public"."bamboo_plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_planting_location_id_locations_id_fk" FOREIGN KEY ("planting_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;