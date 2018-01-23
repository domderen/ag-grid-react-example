import React, {Component} from "react";
import _ from 'lodash';

import {AgGridReact} from "ag-grid-react";
import {connect} from "react-redux";

import PriceRenderer from "./PriceRenderer";

const HotFormulaParser = require('hot-formula-parser');
import {FORMULAS} from './formulas';

/*
 * This component serves to display the row data (provided by redux)
 */
class GridComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnDefs: [
                {
                    field: 'symbol'
                },
                {
                    field: 'price',
                    cellClass: 'align-right',
                    cellRendererFramework: PriceRenderer
                },
            ]
        };

        this.onGridReady = this.onGridReady.bind(this);
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;

        this.gridApi.sizeColumnsToFit();
    }

    createColumn(headerName, formula) {
        return {
            headerName,
            valueGetter: function (params) {
                let parser = new HotFormulaParser.Parser();
                Object.keys(params.data).forEach(q => parser.setVariable(`_${q}`, params.data[q]))
                let result = parser.parse(formula); // It returns `Object {error: null, result: 14}`
                const val = result.error ? result.error : result.result;
                parser = undefined;
                result = undefined;
                return val;
            }
        };
    }

    addColumn(e) {
        e.preventDefault();
        this.setState({
            columnDefs: [...this.state.columnDefs, this.createColumn(this.refs.name.value, this.refs.formula.value)]
        });
        this.refs.name.value = '';
        this.refs.formula.value = '';
    }

    variables() {
        return _.uniq(_.flatten(this.props.rowData.map(q => Object.keys(q)))).map(q => `_${q}`);
    }

    formulas() {
        return HotFormulaParser.SUPPORTED_FORMULAS.map(q => {
            const formulaDesc = FORMULAS.find(w => w.name === q);

            if(formulaDesc) return formulaDesc;

            return {name: q};
        });
    }

    // row data will be provided via redux on this.props.rowData
    render() {
        return (
            <div style={{height: 400, width: 900, marginTop: 15}}
                 className="ag-fresh">
                <AgGridReact
                    // properties
                    columnDefs={this.state.columnDefs}
                    rowData={this.props.rowData}

                    // events
                    onGridReady={this.onGridReady}>
                </AgGridReact>
                <h3>Available Variables</h3>
                <ul>
                {
                    this.variables().map(q => <li key={q} >{q}</li>)
                }
                </ul>
                <div>{}</div>
                <form onSubmit={this.addColumn.bind(this)}>
                    <div className="form-group">
                        <input name="name" className="form-control" placeholder="name" ref="name"/>
                    </div>
                    <div className="form-group">
                        <input name="formula" className="form-control" placeholder="formula" ref="formula"/>
                    </div>
                    <button type="submit" className="btn btn-default">Add new column</button>
                </form>
                <h3>Supported Formulas</h3>
                <ul>
                {
                    this.formulas().map((q, i) => <li key={i}><a href={q.link} target="_blank">{q.name}</a> <span>{q.desc}</span></li>)
                }
                </ul>
            </div>
        )
    }
}

// pull off row data changes
export default connect(
    (state) => {
        return {
            rowData: state.rowData
        }
    }
)(GridComponent);