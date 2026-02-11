export default function Footer({ footerNavigation, }) {
    return (<div className="dark:bg-boxdark-2 mx-auto mt-6 max-w-7xl px-6 lg:px-8">
      <footer aria-labelledby="footer-heading" className="relative border-t border-gray-900/10 py-8 dark:border-gray-200/10">
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="flex items-center justify-center">
          <ul role="list" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerNavigation.company.map((item) => (<li key={item.name}>
                <a href={item.href} className="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  {item.name}
                </a>
              </li>))}
          </ul>
        </div>
      </footer>
    </div>);
}
//# sourceMappingURL=Footer.jsx.map