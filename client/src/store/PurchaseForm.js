import React, { Component } from 'react'
import { reduxForm, Field, FieldArray } from 'redux-form'
import { connect } from 'react-redux'
import moment from 'moment'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'

import { Input, DatePicker, FilterSelect, Select, TextArea, ReportFooter } from '../components'
import { transformArticle,total_, toFixedWithoutTrailingZero as fixed, validator, filterOption } from '../utils'

const styles = theme => ({
  root: {
  },
  submitButton: {
    width: '100%',
  },
})

const EntryTable = connect(
  state => ({
    ...transformArticle(state.system.articles.toArray()),
    products: state.system.products,
  })
)(({ fields, typeNameMap, nameArticleMap, products }) => {
  const add = () => {
    if (fields.length > 0) {
      let name = fields.get(fields.length - 1).name
      let type = fields.get(fields.length - 1).type
      fields.push({ type, name })
    } else {
      fields.push({ type: Object.keys(typeNameMap)[0] })
    }
  }

  const getNameOptions = (type) => {
    // 因为有的旧数据存在分类问题，所以这里加一个判断空的处理
    // 尽管我们可以把所有数据问题都解决掉，但是不可否认，我已经检查过一遍数据却还存在这个问题，所以还有隐含的问题
    if (typeNameMap[type]) {
      return typeNameMap[type].map(name => ({value: name, label: name, pinyin: nameArticleMap[name].pinyin}))
    } else {
      return []
    }

  }

  const getSizeOptions = (name) => {
    const article = nameArticleMap[name]
    return article ? article.sizes.map(size => ({ value: size, label: size }))
      : []
  }

  const getTotal = (index) => {
    try {
      const entry = fields.get(index)
      const total = total_(entry, products)
      return isNaN(total) ? false : total
    } catch (e) {
      return false
    }
  }

  // 下面进行数字计算的函数的原则是，如果能算出数字，返回数字，否则返回 false
  // 除不尽的情况下不处理
  const getUnit = (index) => {
    const entry = fields.get(index)
    const article = nameArticleMap[entry.name]
    return article ? article.unit : false
  }

  const getSum = (index) => {
    const entry = fields.get(index)
    const sum = getTotal(index) * entry.price
    return isNaN(sum) ? false : sum
  }

  const getFreight = (index) => {
    const entry = fields.get(index)
    const freight = entry.freightPrice * entry.freightCount
    return isNaN(freight) ? false : freight
  }

  const getMixSum = (index) => {
    const sum = getSum(index)
    const freight = getFreight(index)
    const mixSum = (sum ? sum : 0) + (freight ? freight: 0)
    return mixSum ? mixSum : false
  }

  const getMixPrice = (index) => {
    const total = getTotal(index)
    return total ? getMixSum(index) / total : false
  }

  const getReport = () => {
    let totalObj = {}
    for (let i = 0; i < fields.length; i++) {
      let entry = fields.get(i)
      let total = getTotal(i)
      total = total ? total : 0

      if (!entry.name) break // name 没填写的时候直接跳出

      if (totalObj[entry.name]) {
        totalObj[entry.name] += Number(total)
      } else {
        totalObj[entry.name] = Number(total)
      }
    }

    let total = []
    /* eslint guard-for-in: off */
    for (let i in totalObj) {
      total.push({
        name : i,
        total: totalObj[i],
        unit: nameArticleMap[i].unit
      })
    }

    return total
  }

  return (
    [
      <Table className="table" id="purchase-table">
        <TableHead>
          <TableRow>
            <TableCell>类型</TableCell>
            <TableCell>名称</TableCell>
            <TableCell>规格</TableCell>
            <TableCell>数量</TableCell>
            <TableCell>小计</TableCell>
            <TableCell>单位</TableCell>
            <TableCell>单价</TableCell>
            <TableCell>金额</TableCell>
            <TableCell>吨/趟</TableCell>
            <TableCell>运费单位</TableCell>
            <TableCell>运费单价</TableCell>
            <TableCell>运费</TableCell>
            <TableCell>综合单价</TableCell>
            <TableCell>综合金额</TableCell>
            <TableCell>备注</TableCell>
            <TableCell>
              <Button
                variant="raised"
                color="primary"
                onClick={add}
              >增加</Button>
            </TableCell>
            <TableCell/>
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.map((entry, index) =>
            <TableRow key={index}>
              <TableCell style={{minWidth: '6em'}}>
                <Field name={`${entry}.type`} component={Select}>
                  {Object.keys(typeNameMap).map((type, index) => (
                    <option key={index}>{type}</option>
                  ))}
                </Field>
              </TableCell>
              <TableCell style={{minWidth: '7em'}}>
                <Field
                  name={`${entry}.name`}
                  component={FilterSelect}
                  options={getNameOptions(fields.get(index).type)}
                  validate={validator.required}
                  placeholder="名称"
                  filterOption={filterOption}
                />
              </TableCell>
              <TableCell style={{minWidth: '11em'}}>
                <Field
                  name={`${entry}.size`}
                  component={FilterSelect}
                  options={getSizeOptions(fields.get(index).name)}
                  validate={validator.required}
                  placeholder="规格"
                />
              </TableCell>
              <TableCell><Field name={`${entry}.count`} component={Input} validate={validator.required}/></TableCell>
              <TableCell>{fixed(getTotal(index))}</TableCell>
              <TableCell>{getUnit(index)}</TableCell>
              <TableCell><Field name={`${entry}.price`} component={Input}/></TableCell>
              <TableCell>{fixed(getSum(index))}</TableCell>
              <TableCell><Field name={`${entry}.freightCount`} component={Input}/></TableCell>
              <TableCell style={{minWidth: '5em'}}>
                <Field name={`${entry}.freightUnit`} component={Select}>
                  <option>吨</option>
                  <option>趟</option>
                </Field>
              </TableCell>
              <TableCell><Field name={`${entry}.freightPrice`} component={Input}/></TableCell>
              <TableCell>{fixed(getFreight(index))}</TableCell>
              <TableCell>{fixed(getMixPrice(index))}</TableCell>
              <TableCell>{fixed(getMixSum(index))}</TableCell>
              <TableCell><Field name={`${entry}.comments`} component={Input}/></TableCell>
              <TableCell>
                <Button
                  variant="raised"
                  color="primary"
                  onClick={add}
                >增加</Button>
              </TableCell>
              <TableCell>
                <Button
                  color="secondary"
                  onClick={() => fields.remove(index)}
                >删除</Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>,
      <ReportFooter report={getReport()} noWeight={true}/>,
    ]
  )
})


class TransferForm extends Component {
  render() {
    const { classes, title, action } = this.props
    return (
      <Card className={classes.root}>
        <CardHeader title={title} action={action}/>
        <CardContent>
          <form className="form-horizontal" onSubmit={this.props.handleSubmit}>
            <div className="form-group">
              <label className="control-label col-md-1">项目部</label>
              <div className="col-md-3">
                <Field
                  name="project"
                  component={FilterSelect}
                  validate={validator.required}
                  options={this.props.projects.map(project => ({
                    value: project._id,
                    label: project.company + project.name,
                    pinyin: project.pinyin
                  }))}
                  filterOption={filterOption}
                  placeholder="请选择项目" />
              </div>
              <label className="control-label col-md-1">对方单位</label>
              <div className="col-md-3">
                <Field name="vendor" component={Input} validate={validator.required}/>
              </div>
              <label className="control-label col-md-1">日期</label>
              <div className="col-md-3">
                <Field name="outDate" component={DatePicker}/>
              </div>
            </div>
            <div className="form-group">
              <label className="control-label col-md-1">原始单号</label>
              <div className="col-md-3">
                <Field name="originalOrder" component={Input}/>
              </div>
              <label className="control-label col-md-1">车号</label>
              <div className="col-md-3">
                <Field name="carNumber" component={Input}/>
              </div>
            </div>
            <div className="form-group">
              <label className="control-label col-md-1">备注</label>
              <div className="col-md-11">
                <Field name="comments" component={TextArea}/>
              </div>
            </div>
            <div className="form-group">
              <div className="col-md-12">
                <FieldArray name="entries" component={EntryTable}/>
              </div>
            </div>
            <Button type="submit" color="primary" variant="raised" className={classes.submitButton}>保存</Button>
          </form>
        </CardContent>
      </Card>
    )
  }
}

TransferForm = reduxForm({
  form: 'purchase',
  initialValues: {
    outDate: moment()
  }
})(TransferForm)

TransferForm.propTypes = {
  classes: PropTypes.object.isRequired,
}

const mapStateToProps = state => ({
  projects: state.system.projects.toArray(),
  stocks: state.store.stocks,
})


export default connect(mapStateToProps)(withStyles(styles)(TransferForm))