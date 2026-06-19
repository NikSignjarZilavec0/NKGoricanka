/** Compact gradient page header used on inner public pages. `children` go to the right. */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <section className="page-header">
      <div className="container page-header__inner">
        <div>
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {children && <div className="page-header__aside">{children}</div>}
      </div>
    </section>
  );
}
