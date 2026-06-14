/** Compact gradient page header used on inner public pages. */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <section className="page-header">
      <div className="container">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
