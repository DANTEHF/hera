/**
 * Created by seal on 12/01/2017.
 */

import React, { Component } from 'react';
import Select from 'react-select';
import { calculateSize, toFixedWithoutTrailingZero } from '../utils';

export default class InputForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      type: '租赁类',
      name: '',
      size: '',
      count: 0,
      total: '',
      unit: '',
      price: 0,
      sum: 0,
      freightChecked: false,
      freightCount: 0,
      freightUnit: '吨',
      freightPrice: 4000,
      freight: 0,
      mixPrice: 0,
      mixSum: 0
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  static propTypes = {
    onAdd: React.PropTypes.func.isRequired,
    nameArticleMap: React.PropTypes.object.isRequired,
    typeNameMap: React.PropTypes.object.isRequired
  };

  handleChange(e) {
    if (e.target.name) {
      if (e.target.type === 'checkbox') {
        this.setState({
          [e.target.name]: e.target.checked
        });
      } else {
        this.setState({
          [e.target.name]: e.target.value
        });
      }

      if (e.target.name === 'type') {
        this.setState({
          name: '',
          size: '',
          count: 0,
        });
      }
    }
  }

  handleNameChange = (name) => {
    this.setState(prevState => ({
      name: name.value,
      size: '',
      count: 0,
    }));
  }

  handleSizeChange = (size) => {
    this.setState(prevState => ({
      size: size.value,
      count: 0,
    }));
  }

  handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    this.setState(prevState => {
      let state = prevState;
      state.total = toFixedWithoutTrailingZero(calculateSize(prevState.size) * prevState.count);
      state.sum = toFixedWithoutTrailingZero(prevState.price * state.total);
      if (prevState.freightChecked) {
        state.freight = toFixedWithoutTrailingZero(prevState.freightCount * prevState.freightCount);
      }
      state.mixSum = toFixedWithoutTrailingZero(state.freight + state.sum);
      state.mixPrice = toFixedWithoutTrailingZero(state.mixSum / state.total);

      this.props.onAdd(state);
      return state;
    });
  }

  getNames(type) {
    return this.props.typeNameMap[type] || [];
  }

  getSizes(name) {
    const article = this.props.nameArticleMap[name];
    return article ? article.sizes : [];
  }

  getUnit(name) {
    const article = this.props.nameArticleMap[name];
    return article ? article.unit : '';
  }

  render() {
    return (
      <form className="form-inline" onSubmit={this.handleSubmit}>
        <fieldset>
          <legend>新增条目</legend>
          <div className="form-group">
            <label className="control-label">类型</label>
            <select name="type" className="form-control" value={this.state.type} onChange={this.handleChange}>
              <option>租赁类</option>
              <option>耗损类</option>
              <option>工具类</option>
            </select>
          </div>
          <div className="form-group">
            <label className="control-label">名称</label>
            <Select
              name="name"
              clearable={false}
              placeholder=""
              value={this.state.name}
              options={this.getNames(this.state.type).map(name => ({ value: name, label: name }))}
              onChange={this.handleNameChange}
            />
          </div>
          <div className="form-group">
            <label className="control-label">规格</label>
            <Select
              name="size"
              clearable={false}
              placeholder=""
              value={this.state.size}
              options={this.getSizes(this.state.name).map(size => ({ value: size, label: size}))}
              onChange={this.handleSizeChange}
            />
          </div>
          <div className="form-group">
            <label className="control-label">数量</label>
            <input type="text" name="count" autoComplete="off" className="form-control" value={this.state.count} onChange={this.handleChange}/>
          </div>
          <div className="form-group">
            <label className="control-label">单位</label>
            <input type="text" name="unit" autoComplete="off" className="form-control" value={this.state.unit} onChange={this.handleChange}/>
          </div>
          <div className="form-group">
            <label className="control-label">单价</label>
            <input type="text" name="price" autoComplete="off" className="form-control" value={this.state.price} onChange={this.handleChange} />
          </div>
          <div className="form-group">
            <label className="control-label">
              是否有运费 <input type="checkbox" name="freightChecked" checked={this.state.freightChecked} onChange={this.handleChange} />
            </label>
          </div>
          <div className="form-group" style={{display: this.state.freightChecked? 'inline-block' : 'none'}}>
            <input name="freightCount" className="form-control" value={this.state.freightCount} onChange={this.handleChange} />
            <select name="freightUnit" className="form-control" value={this.state.freightUnit} onChange={this.handleChange}>
              <option value="吨">吨</option>
              <option value="趟">趟</option>
            </select>
          </div>
          <div className="form-group" style={{display: this.state.freightChecked? 'inline-block' : 'none'}}>
            <label className="control-label">运费单价</label>
            <input type="text" name="freightPrice" autoComplete="off" required="required" className="form-control" value={this.state.freightPrice} onChange={this.handleChange} />
          </div>
          <div className="form-group">
            <button className="btn btn-primary">添加</button>
          </div>
        </fieldset>
      </form>
    );
  }
}