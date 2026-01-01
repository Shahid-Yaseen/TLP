import { Admin, Resource, CustomRoutes, Layout } from 'react-admin';
import { Route } from 'react-router-dom';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { Login } from './components/Login';
import LaunchStatistics from './pages/LaunchStatistics';
import CrewMap from './pages/CrewMap';
import CustomMenu from './components/CustomMenu';

// Reference Data Resources
import { ProviderList, ProviderCreate, ProviderEdit, ProviderShow } from './resources/Providers';
import { OrbitList, OrbitCreate, OrbitEdit, OrbitShow } from './resources/Orbits';
import { LaunchSiteList, LaunchSiteCreate, LaunchSiteEdit, LaunchSiteShow } from './resources/LaunchSites';

// Main Resources
import { LaunchList, LaunchCreate, LaunchEdit, LaunchShow } from './resources/Launches';
import { ArticleList, ArticleCreate, ArticleEdit, ArticleShow } from './resources/News';
import { AuthorList, AuthorCreate, AuthorEdit, AuthorShow } from './resources/Authors';
import { CategoryList, CategoryCreate, CategoryEdit, CategoryShow } from './resources/Categories';
import { TagList, TagCreate, TagEdit, TagShow } from './resources/Tags';
import { UserList, UserCreate, UserEdit, UserShow } from './resources/Users';
import { EventList, EventCreate, EventEdit, EventShow } from './resources/Events';
import { CrewList, CrewCreate, CrewEdit, CrewShow } from './resources/Crew';
import { RoleList, RoleCreate, RoleEdit, RoleShow } from './resources/Roles';
import { PermissionList, PermissionCreate, PermissionEdit, PermissionShow } from './resources/Permissions';
import { StockTickerList, StockTickerCreate, StockTickerEdit, StockTickerShow } from './resources/StockTickers';
import { SubscriptionsList } from './resources/Subscriptions';

// Spacebase Resources
import { AstronautList, AstronautShow } from './resources/Spacebase';
import { AgencyList, AgencyCreate, AgencyEdit, AgencyShow } from './resources/Spacebase';
import { RocketList, RocketShow } from './resources/Spacebase';
import { CountryList, CountryCreate, CountryEdit, CountryShow } from './resources/Countries';

const CustomLayout = (props: any) => <Layout {...props} menu={CustomMenu} />;

const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    loginPage={Login}
    title="TLP Platform Admin"
    requireAuth
    layout={CustomLayout}
  >
    {/* Reference Data */}
    <Resource
      name="providers"
      list={ProviderList}
      create={ProviderCreate}
      edit={ProviderEdit}
      show={ProviderShow}
      options={{ label: 'Providers' }}
    />
    <Resource
      name="orbits"
      list={OrbitList}
      create={OrbitCreate}
      edit={OrbitEdit}
      show={OrbitShow}
      options={{ label: 'Orbits' }}
    />
    <Resource
      name="launch_sites"
      list={LaunchSiteList}
      create={LaunchSiteCreate}
      edit={LaunchSiteEdit}
      show={LaunchSiteShow}
      options={{ label: 'Launch Sites' }}
    />
    <Resource
      name="stock_tickers"
      list={StockTickerList}
      create={StockTickerCreate}
      edit={StockTickerEdit}
      show={StockTickerShow}
      options={{ label: 'Stock Tickers' }}
    />
    <Resource
      name="subscriptions"
      list={SubscriptionsList}
      options={{ label: 'Subscriptions' }}
    />

    {/* Main Resources */}
    <Resource
      name="launches"
      list={LaunchList}
      create={LaunchCreate}
      edit={LaunchEdit}
      show={LaunchShow}
      options={{ label: 'Launches' }}
    />
    <Resource
      name="articles"
      list={ArticleList}
      create={ArticleCreate}
      edit={ArticleEdit}
      show={ArticleShow}
      options={{ label: 'Articles' }}
    />
    <Resource
      name="authors"
      list={AuthorList}
      create={AuthorCreate}
      edit={AuthorEdit}
      show={AuthorShow}
      options={{ label: 'Authors' }}
    />
    <Resource
      name="categories"
      list={CategoryList}
      create={CategoryCreate}
      edit={CategoryEdit}
      show={CategoryShow}
      options={{ label: 'Categories' }}
    />
    <Resource
      name="tags"
      list={TagList}
      create={TagCreate}
      edit={TagEdit}
      show={TagShow}
      options={{ label: 'Tags' }}
    />
    <Resource
      name="users"
      list={UserList}
      create={UserCreate}
      edit={UserEdit}
      show={UserShow}
      options={{ label: 'Users' }}
    />
    <Resource
      name="events"
      list={EventList}
      create={EventCreate}
      edit={EventEdit}
      show={EventShow}
      options={{ label: 'Events' }}
    />
    <Resource
      name="crew"
      list={CrewList}
      create={CrewCreate}
      edit={CrewEdit}
      show={CrewShow}
      options={{ label: 'Crew Members' }}
    />
    <Resource
      name="roles"
      list={RoleList}
      create={RoleCreate}
      edit={RoleEdit}
      show={RoleShow}
      options={{ label: 'Roles' }}
    />
    <Resource
      name="permissions"
      list={PermissionList}
      create={PermissionCreate}
      edit={PermissionEdit}
      show={PermissionShow}
      options={{ label: 'Permissions' }}
    />

    {/* Spacebase Resources */}
    <Resource
      name="astronauts"
      list={AstronautList}
      show={AstronautShow}
      options={{ label: 'Astronauts' }}
    />
    <Resource
      name="agencies"
      list={AgencyList}
      create={AgencyCreate}
      edit={AgencyEdit}
      show={AgencyShow}
      options={{ label: 'Agencies' }}
    />
    <Resource
      name="rockets"
      list={RocketList}
      show={RocketShow}
      options={{ label: 'Rockets' }}
    />
    <Resource
      name="countries"
      list={CountryList}
      create={CountryCreate}
      edit={CountryEdit}
      show={CountryShow}
      options={{ label: 'Countries' }}
    />
    <CustomRoutes>
      <Route path="/launch-statistics" element={<LaunchStatistics />} />
      <Route path="/crew-map" element={<CrewMap />} />
    </CustomRoutes>
  </Admin>
);

export default App;
