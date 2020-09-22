import "./TodoList.css";

import {
  Add as AddIcon,
  Close,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  ListAlt as ListIcon,
  Search,
  SortByAlpha as SortByAlphaIcon,
} from "@material-ui/icons";
import {
  AppBar,
  Checkbox,
  Fade,
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
    isSorted: Boolean,
    taskValue: "",
    isEditing: {},
    editedValue: "",
    isChecked: {},
    isLoading: false,
    isSearching: undefined,
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
      this.handleUpdateIndexDB,
      console.log(this.state.isSorted)
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
    if (e.target.value !== "") {
      this.setState({
        editedValue: e.target.value,
      });
    }
  };

  handleEditTodo = ({ key }, event) => {
    this.setState(
      (prevState) => {
        const newItems = [...prevState.items];
        const index = newItems.findIndex((item) => item.key === key);
        console.log(this.state.editedValue);
        if (this.state.editedValue !== "") {
          if (index > -1) {
            newItems[index].text = this.state.editedValue;
          }
        }

        return {
          items: newItems,
          isEditing: { [key]: false },
          editedValue: "",
        };
      },

      this.handleUpdateIndexDB
    );
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

  handleSearchCheck = () => {
    this.setState((prevState) => ({
      isSearching: !prevState.isSearching,
    }));
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
        // secondary={item.checked && "Completed !"}
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
                <DragIcon size="small" color="disabled" />
              </ListItemIcon>
              <ListItemIcon>
                <Checkbox
                  checked={item.checked || false}
                  onChange={(event) => this.handleCheckboxChange(item, event)}
                  color="primary"
                  size="small"
                />
              </ListItemIcon>
              {this.renderItem(item)}
              <ListItemSecondaryAction className="iconSpacing">
                {!isEditing[item.key] && (
                  <IconButton
                    onClick={(e) => this.handleEditStateChange(e, item)}
                    className="iconSpacing editIcon"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton onClick={() => this.handleDeleteItem(item)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </div>
        )}
      </Draggable>
    ));
  };

  render() {
    const { taskValue, isLoading, items, isSearching } = this.state;

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

    let getDays = days[date.getDay()];
    let getMonths = months[date.getMonth()];
    let getYears = date.getFullYear();
    return (
      <Grid container justify="center" alignItems="center">
        <AppBar position="static" className="appBarStyle">
          <Grid container justify="center" alignItems="center">
            <Grid item xs={5} md={5} className="headerTop">
              <ListIcon
                style={{ fontSize: "1.25rem" }}
                className="headerIcon"
              />
              <Typography className="title">To Do List</Typography>
            </Grid>
            <Grid item xs={7} md={7} className="text-right">
              <Grid item xs>
                {isSearching && (
                  <Fade in>
                    <TextField
                      label="Search"
                      // margin="dense"
                      name="keyword"
                      onChange={this.handleInputChange}
                      // variant="outlined"
                      className="searchBar"
                      autoFocus
                      onBlur={this.handleSearchCheck}
                    />
                  </Fade>
                )}

                {isSearching ? (
                  <Fade in>
                    <IconButton
                      onClick={this.handleSearchCheck}
                      className="searchBtn"
                    >
                      <Close className="searchIcon" />
                    </IconButton>
                  </Fade>
                ) : (
                  <Fade in>
                    <IconButton
                      onClick={this.handleSearchCheck}
                      className="searchBtn"
                    >
                      <Search className="searchIcon" />
                    </IconButton>
                  </Fade>
                )}
              </Grid>
              {/* <Grid item xs></Grid> */}
            </Grid>
          </Grid>
        </AppBar>
        <Grid
          container
          justify="center"
          alignItems="center"
          className="grid-padding"
        >
          <Paper className="paper">
            <Grid
              container
              spacing={1}
              justify="flex-start"
              alignItems="center"
              className="block1"
            >
              <Grid item xs="auto" md>
                <Typography variant="h6" className="dayToday">
                  {get}
                </Typography>
              </Grid>
              <Grid container item xs={6} md={9} direction="column">
                <Grid item xs>
                  <Typography
                    variant="body2"
                    className="getDays"
                    justify="flex-end"
                  >
                    {getDays}
                  </Typography>
                </Grid>
                <Grid item xs="auto">
                  <Typography variant="caption" className="getYears">
                    {getMonths}, {getYears}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={3} md className="text-right">
                <Typography variant="caption">{getItemLength} Tasks</Typography>
              </Grid>
            </Grid>
            <Grid
              container
              justify="center"
              alignItems="center"
              className="grid-spacing"
            >
              <Grid container item xs={11} md={11}>
                <form onSubmit={(e) => this.handleAddItem(e)}>
                  <TextField
                    label="Enter Task"
                    margin="dense"
                    name="taskValue"
                    onChange={this.handleInputChange}
                    value={taskValue}
                    variant="outlined"
                    className="textInput"
                    required
                  />
                  <IconButton type="submit" className="addIcon">
                    <AddIcon style={{ fontSize: "1rem" }} />
                  </IconButton>
                </form>
              </Grid>
              <Grid container item xs={1} md={1} justify="flex-end">
                <IconButton
                  onClick={this.handleToggleSort}
                  type="submit"
                  color="primary"
                  className="sortIcon"
                >
                  <SortByAlphaIcon style={{ fontSize: "1rem" }} />
                </IconButton>
              </Grid>
            </Grid>
            <Grid container item xs={12} md={12}>
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
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default TodoList;
