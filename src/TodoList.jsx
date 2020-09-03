import "./TodoList.css";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  SortByAlpha as SortByAlphaIcon,
} from "@material-ui/icons";
import {
  AppBar,
  Checkbox,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import React, { Component } from "react";

import EventNoteIcon from "@material-ui/icons/EventNote";
import { Skeleton } from "@material-ui/lab";
import localforage from "localforage";

const LOCAL_STORAGE_KEY = "TODO_LIST";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

class TodoList extends Component {
  state = {
    items: [],
    keyword: "",
    isSorted: undefined,
    taskValue: "",
    isEditing: {},
    editedValue: "",
    isChecked: {},
    isLoading: false,
  };

  componentDidMount() {
    this.setState({
      isLoading: true,
    });

    localforage
      .getItem(LOCAL_STORAGE_KEY)
      .then((list = []) => this.setState({ items: list || [] }))
      .catch(console.error)
      .finally(() => this.setState({ isLoading: false }));
  }

  handleUpdateIndexDB = () => {
    const { items } = this.state;
    localforage.setItem(LOCAL_STORAGE_KEY, items).catch(console.error);
  };

  getItemStyle = (draggableStyle) => ({
    userSelect: "none",
    ...draggableStyle,
  });

  handleOnDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    this.setState(
      (prevState) => ({
        items: reorder(
          prevState.items,
          result.source.index,
          result.destination.index
        ),
      }),
      this.handleUpdateIndexDB
    );
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
    // e.stopPropagation();
  };

  handleAddItem = (e) => {
    e.preventDefault();

    const { taskValue } = this.state;

    if (taskValue !== "") {
      const newItem = {
        text: taskValue,
        key: Date.now(),
        checked: false,
      };

      this.setState(
        (prevState) => ({
          items: [newItem, ...prevState.items],
          taskValue: "",
        }),
        this.handleUpdateIndexDB
      );
    }
  };

  handleDeleteItem = ({ key }) => {
    this.setState((prevState) => {
      const newItems = [...prevState.items];
      const index = newItems.findIndex((item) => item.key === key);
      if (index > -1) {
        newItems.splice(index, 1);
      }
      return { items: newItems };
    }, this.handleUpdateIndexDB);
  };

  handleToggleSort = () => {
    this.setState(
      (prevState) => ({
        isSorted: !prevState.isSorted,
      }),
      this.handleUpdateIndexDB
    );
    this.handleSort();
  };

  handleSort = () => {
    let { items, isSorted } = this.state;

    if (isSorted !== undefined) {
      items = items.sort((a, b) => {
        if (a.text < b.text) {
          return isSorted ? -1 : 1;
        }
        if (a.text > b.text) {
          return isSorted ? 1 : -1;
        }
        return 0;
      });
    }
  };

  handleEditStateChange = (e, { key }) => {
    this.setState({ isEditing: { [key]: true } });
  };

  editTodoValue = (e) => {
    this.setState({
      editedValue: e.target.value,
    });
  };

  handleEditTodo = ({ key }, event) => {
    this.setState((prevState) => {
      const newItems = [...prevState.items];
      const index = newItems.findIndex((item) => item.key === key);
      if (index > -1) {
        newItems[index].text = this.state.editedValue;
      }
      return {
        items: newItems,
        isEditing: { [key]: false },
      };
    }, this.handleUpdateIndexDB);
  };

  handleCheckboxChange = ({ key }, event) => {
    const { checked } = event.target;

    this.setState((prevState) => {
      const newItems = [...prevState.items];
      const index = newItems.findIndex((item) => item.key === key);

      if (index > -1) {
        newItems[index].checked = checked;
      }
      return newItems;
    }, this.handleUpdateIndexDB);
  };

  renderItem = (item) => {
    const { isEditing } = this.state;
    if (isEditing[item.key]) {
      return (
        <TextField
          autoFocus
          helperText="Please key in todo"
          label="Edit Task"
          onChange={(e) => this.editTodoValue(e)}
          onBlur={(event) => this.handleEditTodo(item, event)}
          size="small"
        />
      );
    }
    return (
      <ListItemText
        primary={item.text}
        primaryTypographyProps={{
          className: item.checked ? "lineThrough" : "",
        }}
        secondary={item.checked && "Completed !"}
      />
    );
  };

  renderLoader = () =>
    [...Array(Math.floor(Math.random() * 11))].map((_, index) => (
      <Skeleton key={index} height={50} width="100%" />
    ));

  renderItems = () => {
    let { items, isEditing } = this.state;
    const { keyword } = this.state;
    if (keyword) {
      items = items.filter((item) => item.text.includes(keyword));
    }

    return items.map((item, idx) => (
      <Draggable key={item.key} draggableId={`${item.key}`} index={idx}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={this.getItemStyle(provided.draggableProps.style)}
          >
            <ListItem disableGutters key={item.key}>
              <ListItemIcon>
                <Checkbox
                  checked={item.checked || false}
                  onChange={(event) => this.handleCheckboxChange(item, event)}
                  color="primary"
                />
              </ListItemIcon>
              {this.renderItem(item)}
              <ListItemSecondaryAction className="iconSpacing">
                {!isEditing[item.key] && (
                  <IconButton
                    onClick={(e) => this.handleEditStateChange(e, item)}
                    className="iconSpacing"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                <IconButton onClick={() => this.handleDeleteItem(item)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </div>
        )}
      </Draggable>
    ));
  };

  render() {
    const { taskValue, isLoading, items } = this.state;

    let getItemLength = items.length;

    let date = new Date();
    let get = ("0" + date.getDate()).slice(-2);

    let days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    let months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    var getDays = days[date.getDay()];
    var getMonths = months[date.getMonth()];
    var getYears = date.getFullYear();

    return (
      <Paper>
        <AppBar className="appBarStyle" position="static">
          <Grid container justify="center" alignItems="center">
            <Grid item xs>
              <Typography variant="h6" className="title">
                To Do List App
              </Typography>
            </Grid>
            <Grid item xs={4}></Grid>
            <Grid item xs className="iconAlign">
              <EventNoteIcon style={{ fontSize: "1.25rem" }} />
            </Grid>
          </Grid>
        </AppBar>
        <Paper className="paper">
          <div className="todoListMain">
            <Grid
              container
              spacing={1}
              justify="center"
              alignItems="center"
              className="gridMargin"
            >
              <Grid item xs>
                <Typography variant="h6" className="dayToday">
                  {get}
                </Typography>
              </Grid>
              <Grid container item xs={8} direction="column">
                <Grid item xs>
                  <Typography
                    variant="body2"
                    className="getDays"
                    justify="flex-end"
                  >
                    {getDays}
                  </Typography>
                </Grid>
                <Grid item xs>
                  <Typography variant="caption" className="getYears">
                    {getMonths}, {getYears}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs>
                <Typography variant="caption" className="iconAlign">
                  {getItemLength} Task
                </Typography>
              </Grid>
            </Grid>
            <div className="header">
              <form onSubmit={(e) => this.handleAddItem(e)}>
                <TextField
                  label="Enter Task"
                  margin="dense"
                  name="taskValue"
                  onChange={this.handleInputChange}
                  value={taskValue}
                  variant="outlined"
                />
                <IconButton type="submit" className="squareBtn addIcon">
                  <AddIcon style={{ fontSize: "1rem" }} />
                </IconButton>
              </form>

              <IconButton
                onClick={this.handleToggleSort}
                type="submit"
                color="primary"
                className="squareBtn sortIcon"
              >
                <SortByAlphaIcon style={{ fontSize: "1rem" }} />
              </IconButton>
            </div>

            <DragDropContext onDragEnd={this.handleOnDragEnd}>
              <Droppable droppableId="droppable">
                {(provided) => (
                  <List {...provided.droppableProps} ref={provided.innerRef}>
                    {provided.placeholder}
                    <ul className="theList">
                      {isLoading ? this.renderLoader() : this.renderItems()}
                    </ul>
                  </List>
                )}
              </Droppable>
            </DragDropContext>
            <TextField
              label="Search Task"
              margin="dense"
              name="keyword"
              onChange={this.handleInputChange}
              variant="outlined"
              className="searchBar"
            />
          </div>
        </Paper>
      </Paper>
    );
  }
}

export default TodoList;
