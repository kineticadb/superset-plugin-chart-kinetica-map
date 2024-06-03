export const twbTemplate = `<?xml version='1.0' encoding='utf-8' ?>

<!-- build 20231.23.0310.1044 -->
<workbook original-version='18.1' source-build='2023.1.0 (20231.23.0310.1044)' source-platform='mac' version='18.1' xmlns:user='http://www.tableausoftware.com/xml/user'>
  <document-format-change-manifest>
    <_.fcp.AnimationOnByDefault.true...AnimationOnByDefault />
    <_.fcp.MarkAnimation.true...MarkAnimation />
    <_.fcp.ObjectModelEncapsulateLegacy.true...ObjectModelEncapsulateLegacy />
    <_.fcp.ObjectModelTableType.true...ObjectModelTableType />
    <_.fcp.SchemaViewerObjectModel.true...SchemaViewerObjectModel />
    <SheetIdentifierTracking />
    <WindowsPersistSimpleIdentifiers />
  </document-format-change-manifest>
  <preferences>
    <preference name='ui.encoding.shelf.height' value='24' />
    <preference name='ui.shelf.height' value='26' />
  </preferences>
  <_.fcp.AnimationOnByDefault.false...style>
    <_.fcp.AnimationOnByDefault.false..._.fcp.MarkAnimation.true...style-rule element='animation'>
      <_.fcp.AnimationOnByDefault.false...format attr='animation-on' value='ao-on' />
    </_.fcp.AnimationOnByDefault.false..._.fcp.MarkAnimation.true...style-rule>
  </_.fcp.AnimationOnByDefault.false...style>
  <datasources>
    <datasource hasconnection='false' inline='true' name='Parameters' version='18.1'>
      <aliases enabled='yes' />
      <column caption='wkt' datatype='string' name='[Parameter 1]' param-domain-type='any' role='measure' type='nominal' value='&quot;POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))&quot;'>
        <calculation class='tableau' formula='&quot;POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))&quot;' />
      </column>
      <column caption='wktviewport' datatype='string' name='[Parameter 2]' param-domain-type='any' role='measure' type='nominal' value='&quot;POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))&quot;'>
        <calculation class='tableau' formula='&quot;POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))&quot;' />
      </column>
    </datasource>
    <datasource caption='Custom SQL Query (___SCHEMA___.___TABLE___)' inline='true' name='federated.0523s7407m5ivl188wpb712u1j7l' version='18.1'>
      <connection class='federated'>
        <named-connections>
          <named-connection caption='jdbc:kinetica:URL=___ENDPOINT___;RowsPerFetch=10000;Timeout=5;CombinePrepareAndExecute=true' name='genericjdbc.1qbggv51016fji14c9ufp0o6e78m'>
            <connection class='genericjdbc' dbname='Kinetica' dialect='genericjdbc' jdbcproperties='' jdbcurl='jdbc:kinetica:URL=___ENDPOINT___;RowsPerFetch=10000;Timeout=5;CombinePrepareAndExecute=true' port='___DB_PORT___' schema='___SCHEMA___' server='___DB_HOST___' username='___DB_USER___' warehouse=''>
              <connection-customization class='genericjdbc' enabled='false' version='18.1'>
                <vendor name='genericjdbc' />
                <driver name='kinetica' />
                <customizations>
                  <customization name='CAP_CONNECT_CUSTOM_SQL_WITHOUT_SCHEMA' value='no' />
                  <customization name='CAP_CREATE_TEMP_TABLES' value='no' />
                  <customization name='CAP_CUSTOM_NOSQL' value='no' />
                  <customization name='CAP_EXTRACT_ONLY' value='no' />
                  <customization name='CAP_ISOLATION_LEVEL_READ_COMMITTED' value='no' />
                  <customization name='CAP_ISOLATION_LEVEL_READ_UNCOMMITTED' value='no' />
                  <customization name='CAP_ISOLATION_LEVEL_REPEATABLE_READS' value='no' />
                  <customization name='CAP_ISOLATION_LEVEL_SERIALIZABLE' value='no' />
                  <customization name='CAP_JDBC_BIND_DETECT_ALIAS_CASE_FOLDING' value='no' />
                  <customization name='CAP_JDBC_SUPPRESS_EMPTY_CATALOG_NAME' value='no' />
                  <customization name='CAP_JDBC_SUPPRESS_ENUMERATE_DATABASES' value='no' />
                  <customization name='CAP_JDBC_SUPPRESS_ENUMERATE_SCHEMAS' value='no' />
                  <customization name='CAP_JDBC_SUPPRESS_ENUMERATE_TABLES' value='no' />
                  <customization name='CAP_QUERY_BOOLEXPR_TO_INTEXPR' value='yes' />
                  <customization name='CAP_QUERY_FROM_REQUIRES_ALIAS' value='no' />
                  <customization name='CAP_QUERY_GROUP_ALLOW_DUPLICATES' value='yes' />
                  <customization name='CAP_QUERY_GROUP_BY_ALIAS' value='no' />
                  <customization name='CAP_QUERY_GROUP_BY_DEGREE' value='yes' />
                  <customization name='CAP_QUERY_HAVING_REQUIRES_GROUP_BY' value='no' />
                  <customization name='CAP_QUERY_HAVING_UNSUPPORTED' value='no' />
                  <customization name='CAP_QUERY_JOIN_ACROSS_SCHEMAS' value='no' />
                  <customization name='CAP_QUERY_JOIN_REQUIRES_SCOPE' value='no' />
                  <customization name='CAP_QUERY_NULL_REQUIRES_CAST' value='no' />
                  <customization name='CAP_QUERY_SELECT_ALIASES_SORTED' value='yes' />
                  <customization name='CAP_QUERY_SORT_BY_DEGREE' value='yes' />
                  <customization name='CAP_QUERY_SUBQUERIES' value='yes' />
                  <customization name='CAP_QUERY_SUBQUERIES_WITH_TOP' value='yes' />
                  <customization name='CAP_QUERY_SUBQUERY_QUERY_CONTEXT' value='yes' />
                  <customization name='CAP_QUERY_TOPSTYLE_LIMIT' value='no' />
                  <customization name='CAP_QUERY_TOPSTYLE_ROWNUM' value='no' />
                  <customization name='CAP_QUERY_TOPSTYLE_TOP' value='yes' />
                  <customization name='CAP_QUERY_TOP_0_METADATA' value='no' />
                  <customization name='CAP_QUERY_TOP_N' value='yes' />
                  <customization name='CAP_QUERY_WHERE_FALSE_METADATA' value='no' />
                  <customization name='CAP_SELECT_INTO' value='yes' />
                  <customization name='CAP_SELECT_TOP_INTO' value='yes' />
                  <customization name='CAP_SET_ISOLATION_LEVEL_VIA_ODBC_API' value='no' />
                  <customization name='CAP_SET_ISOLATION_LEVEL_VIA_SQL' value='no' />
                  <customization name='CAP_SUPPRESS_CONNECTION_POOLING' value='no' />
                  <customization name='CAP_SUPPRESS_DISCOVERY_QUERIES' value='no' />
                </customizations>
              </connection-customization>
            </connection>
          </named-connection>
        </named-connections>
        <_.fcp.ObjectModelEncapsulateLegacy.false...relation connection='genericjdbc.1qbggv51016fji14c9ufp0o6e78m' name='Custom SQL Query' type='text'><![CDATA[___CUSTOM_SQL_QUERY___]]></_.fcp.ObjectModelEncapsulateLegacy.false...relation>
        <_.fcp.ObjectModelEncapsulateLegacy.true...relation connection='genericjdbc.1qbggv51016fji14c9ufp0o6e78m' name='Custom SQL Query' type='text'><![CDATA[___CUSTOM_SQL_QUERY___]]></_.fcp.ObjectModelEncapsulateLegacy.true...relation>
      </connection>
      <aliases enabled='yes' />
      <_.fcp.ObjectModelTableType.true...column caption='Custom SQL Query' datatype='table' name='[__tableau_internal_object_id__].[_F035B717A2444BD4A1FA5D3446EBBC9B]' role='measure' type='quantitative' />
      <layout _.fcp.SchemaViewerObjectModel.false...dim-percentage='0.5' _.fcp.SchemaViewerObjectModel.false...measure-percentage='0.4' dim-ordering='alphabetic' measure-ordering='alphabetic' show-structure='true' />
      <semantic-values>
        <semantic-value key='[Country].[Name]' value='&quot;United States&quot;' />
      </semantic-values>
      <datasource-dependencies datasource='Parameters'>
        <column caption='wkt' datatype='string' name='[Parameter 1]' param-domain-type='any' role='measure' type='nominal' value='&quot;POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))&quot;'>
          <calculation class='tableau' formula='&quot;POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))&quot;' />
        </column>
        <column caption='wktviewport' datatype='string' name='[Parameter 2]' param-domain-type='any' role='measure' type='nominal' value='&quot;POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))&quot;'>
          <calculation class='tableau' formula='&quot;POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))&quot;' />
        </column>
      </datasource-dependencies>
      <_.fcp.ObjectModelEncapsulateLegacy.true...object-graph>
        <objects>
          <object caption='Custom SQL Query' id='_F035B717A2444BD4A1FA5D3446EBBC9B'>
            <properties context=''>
              <relation connection='genericjdbc.1qbggv51016fji14c9ufp0o6e78m' name='Custom SQL Query' type='text'><![CDATA[___CUSTOM_SQL_QUERY___]]></relation>
            </properties>
          </object>
        </objects>
      </_.fcp.ObjectModelEncapsulateLegacy.true...object-graph>
    </datasource>
  </datasources>
  <worksheets>
    <worksheet name='Sheet 1'>
      <table>
        <view>
          <datasources />
          <aggregation value='true' />
        </view>
        <style />
        <panes>
          <pane selection-relaxation-option='selection-relaxation-allow'>
            <view>
              <breakdown value='auto' />
            </view>
            <mark class='Automatic' />
          </pane>
        </panes>
        <rows />
        <cols />
      </table>
      <simple-id uuid='{A780F259-1F75-4534-B416-53B7E48D7A11}' />
    </worksheet>
  </worksheets>
  <windows source-height='30'>
    <window class='worksheet' maximized='true' name='Sheet 1'>
      <cards>
        <edge name='left'>
          <strip size='160'>
            <card type='pages' />
            <card type='filters' />
            <card type='marks' />
          </strip>
        </edge>
        <edge name='top'>
          <strip size='2147483647'>
            <card type='columns' />
          </strip>
          <strip size='2147483647'>
            <card type='rows' />
          </strip>
          <strip size='31'>
            <card type='title' />
          </strip>
        </edge>
      </cards>
      <simple-id uuid='{6B3B2905-D2B7-4DA9-90AD-39480E575965}' />
    </window>
  </windows>
  <thumbnails>
    <thumbnail height='192' name='Sheet 1' width='192'>
      iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAA7DAAAOwwHHb6hk
      AAACFUlEQVR4nO3TMQEAIAzAMMC/5yFjRxMFfXpnZg5Eve0A2GQA0gxAmgFIMwBpBiDNAKQZ
      gDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFI
      MwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQD
      kGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBp
      BiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA
      0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDN
      AKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxA
      mgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZ
      gDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFI
      MwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKQZgDQDkGYA0gxAmgFIMwBpBiDNAKR9Y+0F
      fBUOM1sAAAAASUVORK5CYII=
    </thumbnail>
  </thumbnails>
</workbook>`;
