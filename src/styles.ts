import { styled } from "@superset-ui/core";
import { SupersetPluginChartKineticaMapStylesProps } from "./types";

// The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled

// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts

export const ChartStyles = styled.div<SupersetPluginChartKineticaMapStylesProps>`
  background-color: ${({ theme }: any) => theme.colors.grayscale.light4};
  border-radius: ${({ theme }: any) => theme.gridUnit * 2}px;
  height: ${({ height }: any) => height}px;
  width: ${({ width }: any) => width}px;
`;

export const MapStyles = styled.div`
  ${({ height, width }: any) => `
    .config_header {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 98;
        text-align: center;
    }

    .config_header button {
        font-size: 12px;
        padding-top: 3px;
        padding-bottom: 3px;
    }

    .config_header .badge {
        font-weight: 400;
        border-radius: 5px;
        background-color: #666666;
    }

    .config_header .map_id {
        font-size: 12px;
        color: #00000033;
    }

    .draw {
        position: absolute;
        top: 85px;
        right: 88px;
        z-index: 98;
    }

    .viewport {
        position: absolute;
        top: 85px;
        right: 33px;
        z-index: 98;
    }

    #gcd-container {
        position: absolute;
        top: 7px;
        left: 40px;
        z-index: 98;
    }

    .map {
        border: 1px solid #eeeeee;
        width: ${width}px;
        height: ${height}px;
    }

    .map .ol-overlaycontainer-stopevent {
        z-index: 100 !important;
    }

    .icon {
        height: 16px;
        filter: invert(43%) sepia(100%) saturate(2614%) hue-rotate(195deg)
        brightness(101%) contrast(102%);
    }

    .attribute_popup {
        width: 500px;
        max-width: 500px !important;
    }

    .info_grid {
        font: 11px 'Roboto', Arial, sans-serif;
        overflow-y: hidden;
        height: 99px;
    }
    .info_grid .rdg-header-row * {
        font-weight: bold;
        color: #333333;
        background-color: #eeeeee;
    }
    .info_grid .rdg-row * {
        color: #333333;
        background-color: #ffffff;
    }

    .rotate-45 {
        transform: rotate(45deg);
    }

    .big-bold {
        font-size: 1.5em;
        font-weight: bold;
    }

    .blue {
        color: #1e88e5;
    }

    .grey {
        color: #9e9e9e;
    }

    .text-fit {
        width: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .layers-panel {
        width: 230px;
        background-color: #f8f9fadd;
        opacity: 1.0;
        position: absolute;
        bottom: 35px;
        right: 10px;
        z-index: 98;
        border-radius: 5px;
        padding-right: 2px;
        padding-left: 15px;
        padding-top: 15px;
        padding-bottom: 15px;
    }

    .layers-panel.nopad {
        bottom: 10px;
    }

    .layers-panel h6 {
       font-size: 13px;
    }

    .layers-panel-header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 30px;
        background-color: #c2c0c0;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    }

    .layers-panel-header button {
        margin-top: -6px;
    }

    button#colormap-dropdown {
        width: 146px;
        border: 1px solid #c2c0c0;
    }
 `}
`;
