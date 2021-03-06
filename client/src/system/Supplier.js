import React from 'react'
import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import TableBody from '@material-ui/core/TableBody'
import Button from '@material-ui/core/Button'
import Paper from '@material-ui/core/Paper'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'


const styles = theme => ({
  // root: {
  //   width: '100%',
  //   marginTop: theme.spacing.unit * 3,
  //   overflowX: 'auto',
  // },
})

class Supplier extends React.Component {

  static propTypes = {
    classes: PropTypes.object.isRequired,
  }

  projects = [
    {
      _id: '1',
      company: 'a',
      name: 'a',
      address: '',
    },
    {
      _id: '2',
      company: 'b',
      name: 'b',
      address: '',
    },
  ]

  render() {
    const { classes } = this.props
    return <Paper className={classes.root}>
      <h2 className="page-header">供应商</h2>
      <Button>添加</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>公司名称</TableCell>
            <TableCell></TableCell>
            <TableCell>地址</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.projects.map(project => (
              <TableRow key={project._id}>
                <TableCell>{project.company}</TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.address}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Paper>
  }

}

export default withStyles(styles)(Supplier)