import {Settings} from "lucide-react";
import {getTranslations} from "next-intl/server";
import {getAdminSettingsDashboard} from "@/lib/data/admin";
import {AdminSettingsClient} from "./settings-client";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin.settingsPage"});
  const data = await getAdminSettingsDashboard();

  const labels: Record<string, string> = {};
  const keys = [
    "eyebrow", "title", "description", "languages", "themes", "categories", "featureFlags",
    "light", "dark", "system", "save", "saved", "saving", "cancel", "confirm",
    "confirmAction", "confirmMessage", "dangerZone", "unsavedChanges",
    "platformSettings", "platformSettingsDesc", "platformName", "defaultLanguage", "defaultTheme",
    "contactEmail", "supportEmail", "maintenanceMode", "maintenanceModeDesc",
    "languagesDesc", "arabic", "french", "english", "arabicCannotDisable", "themeDesc",
    "paymentSettings", "paymentSettingsDesc", "bankily", "masrivi", "sedad", "visa", "mastercard",
    "enabled", "disabled", "receiverName", "receiverAccount", "instructions", "verificationRequired", "cardNotice",
    "categoriesDesc", "createCategory", "editCategory", "archiveCategory", "reorderCategories",
    "categoryNameEn", "categoryNameAr", "categoryNameFr", "categorySlug", "categoryIcon", "categoryColor",
    "categoryArchiveWarning", "adminRoles", "adminRolesDesc", "superAdmin", "admin", "moderator",
    "campaignManager", "volunteerManager", "financeManager", "viewer",
    "inviteAdmin", "changeRole", "removeAccess", "lastActive", "permissions", "never",
    "selfRoleChangeWarning", "selfRemoveWarning", "removeAdminConfirm",
    "featureFlagsDesc", "ideas", "graatek", "memories", "messages", "support", "volunteering",
    "donations", "publicRegistration", "qrEntry", "translation", "realtime", "featureFlagDesc",
    "security", "securityDesc", "rlsStatus", "authSettings", "smsVerification", "rateLimiting",
    "auditLogs", "lastSecurityReview", "forceLogout", "rotateTokens", "viewAuditLog",
    "active", "inactive",
    "notificationSettings", "notificationSettingsDesc", "systemAnnouncements", "campaignNotifications",
    "volunteerReminders", "donationConfirmations", "moderationAlerts", "templates",
    "templateArabic", "templateFrench", "templateEnglish",
    "systemHealth", "systemHealthDesc", "supabaseConnection", "vercelDeployment",
    "realtimeStatus", "storageStatus", "errorRate", "healthy", "warning", "critical",
    "allGood", "someIssues", "majorIssues",
    "auditLog", "auditLogDesc", "settingChanged", "oldValue", "newValue", "timestamp", "adminName", "noAuditEntries",
    "platform", "appearance", "integrations", "advanced",
    "navPlatform", "navLanguages", "navAppearance", "navPayments", "navCategories", "navRoles",
    "navFeatures", "navSecurity", "navNotifications", "navHealth", "navAudit",
    "noData", "actions",
  ];
  for (const key of keys) { labels[key] = t(key); }

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Settings size={22} />
        </span>
        <div>
          <p className="text-sm font-bold text-primary">{t("eyebrow")}</p>
          <h1 className="text-2xl font-black">{t("title")}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      <AdminSettingsClient data={data} labels={labels} locale={locale} />
    </div>
  );
}
