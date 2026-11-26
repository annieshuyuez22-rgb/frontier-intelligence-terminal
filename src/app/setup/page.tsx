import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";

export const instant = false;
export const metadata: Metadata = { title: "首次配置" };

export default async function SetupPage() {
  const language = await getLanguage();
  const t = (zh: string, en: string) => translate(language, zh, en);
  return (
    <div className="auth-page">
      <section className="auth-editorial">
        <div><p className="eyebrow">SETUP / 01</p><h1>{t("先建立可信边界，再开始采集。", "Establish trusted boundaries before collecting.")}</h1><p>{t("首管理员拥有来源配置权限。渠道未配置时会明确显示“未配置”，不会被误报为已连接或成功。", "The first administrator can configure sources. Unconfigured channels are labeled honestly, never shown as connected or successful.")}</p></div>
        <div className="setup-notes">
          <div className="setup-note"><strong>{t("01 · 账户与研究偏好", "01 · Account & research preferences")}</strong><span>{t("创建管理员，设置时区、公司、竞品、业务目标和叙事定义。", "Create an administrator and set timezone, companies, competitors, goals, and narrative definitions.")}</span></div>
          <div className="setup-note"><strong>{t("02 · 来源与连接测试", "02 · Sources & connection tests")}</strong><span>{t("RSS / Atom 使用公开 URL；X 需要查询配置；LinkedIn 需要数字组织 ID；搜索需要查询语句与对应服务端能力。", "RSS / Atom uses public URLs; X needs a query; LinkedIn needs a numeric organization ID; search needs a query and the corresponding server capability.")}</span></div>
          <div className="setup-note"><strong>{t("03 · 手动链接与任务", "03 · Manual links & jobs")}</strong><span>{t("可提交公开网页进行单源采集。任务会经历排队、采集、核验与生成，失败不会被写成成功。", "Submit public pages for single-source collection. Jobs move through queue, collection, verification, and generation; failure is never reported as success.")}</span></div>
          <div className="setup-note"><strong>{t("04 · 投递与预算", "04 · Delivery & budgets")}</strong><span>{t("邮件和 Webhook 独立且默认关闭；预算按日报与单次刷新分别限制。", "Email and webhook are independent and off by default; daily and per-refresh budgets are separate.")}</span></div>
        </div>
      </section>
      <section className="auth-form-wrap"><AuthForm kind="setup" nextPath="/settings?wizard=1" /></section>
    </div>
  );
}
