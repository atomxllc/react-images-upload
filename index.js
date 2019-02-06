import React from "react";
import PropTypes from "prop-types";
import "./index.css";
import FlipMove from "react-flip-move";
import UploadIcon from "./UploadIcon.svg";

import closeIcon from "./assets/close.svg";

const styles = {
  display: "flex",
  alignItems: "center",
  // justifyContent: "center",
  flexWrap: "wrap",
  width: "100%"
};

class ReactImageUploadComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pictures: props.value
        ? props.value
        : props.defaultImage
        ? [props.defaultImage]
        : [],
      files: [],
      notAcceptedFileType: [],
      notAcceptedFileSize: []
    };
    this.inputElement = "";
    this.onDropFile = this.onDropFile.bind(this);
    this.onUploadClick = this.onUploadClick.bind(this);
    this.triggerFileUpload = this.triggerFileUpload.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.files !== this.state.files) {
      this.props.onChange(this.state.pictures, this.state.files);
    }
  }

  /*
   Load image at the beggining if defaultImage prop exists
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.value) {
      this.setState({ pictures: nextProps.value });
    } else if (nextProps.defaultImage) {
      this.setState({ pictures: [nextProps.defaultImage] });
    }
  }

  /*
	 Check file extension (onDropFile)
	 */
  hasExtension(fileName) {
    const pattern =
      "(" + this.props.imgExtension.join("|").replace(/\./g, "\\.") + ")$";
    return new RegExp(pattern, "i").test(fileName);
  }

  /*
   Handle file validation
   */
  onDropFile(e) {
    const files = e.target.files;
    const allFilePromises = [];

    // Iterate over all uploaded files
    for (let i = 0; i < files.length; i++) {
      let f = files[i];
      // Check for file extension
      if (!this.hasExtension(f.name)) {
        const newArray = this.state.notAcceptedFileType.slice();
        newArray.push(f.name);
        this.setState({ notAcceptedFileType: newArray });
        continue;
      }
      // Check for file size
      if (f.size > this.props.maxFileSize) {
        const newArray = this.state.notAcceptedFileSize.slice();
        newArray.push(f.name);
        this.setState({ notAcceptedFileSize: newArray });
        continue;
      }

      allFilePromises.push(this.readFile(f));
    }

    Promise.all(allFilePromises).then(newFilesData => {
      const dataURLs = this.state.pictures.slice();
      const files = this.state.files.slice();

      newFilesData.forEach(newFileData => {
        dataURLs.push(newFileData.dataURL);
        // files.push(newFileData.file);
      });

      this.setState(
        {
          pictures: dataURLs
          // files: files
        },
        () => {
          this.props.onChange(this.state.pictures, this.state.files);
        }
      );
    });
  }

  onUploadClick(e) {
    // Fixes https://github.com/JakeHartnell/react-images-upload/issues/55
    e.target.value = null;
  }

  /*
     Read a file and return a promise that when resolved gives the file itself and the data URL
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // Read the image via FileReader API and save image result in state.
      reader.onload = function(e) {
        // Add the file name to the data URL
        let dataURL = e.target.result;
        dataURL = dataURL.replace(";base64", `;name=${file.name};base64`);
        resolve({ file, dataURL });
      };

      reader.readAsDataURL(file);
    });
  }

  /*
   Remove the image from state
   */
  removeImage(picture) {
    const removeIndex = this.state.pictures.findIndex(e => e === picture);

    if (this.props.onRemoveImage) {
      this.props.onRemoveImage(picture, removeIndex);
    }

    const filteredPictures = this.state.pictures.filter(
      (e, index) => index !== removeIndex
    );
    // const filteredFiles = this.state.files.filter(
    //   (e, index) => index !== removeIndex
    // );

    this.setState(
      {
        pictures: filteredPictures
        // files: filteredFiles
      },
      () => {
        this.props.onChange(this.state.pictures, this.state.files);
      }
    );
  }

  /*
   Check if any errors && render
   */
  renderErrors() {
    let notAccepted = null;
    if (this.state.notAcceptedFileType.length > 0) {
      notAccepted = this.state.notAcceptedFileType.map((error, index) => {
        return (
          <div
            className={"errorMessage " + this.props.errorClass}
            key={index}
            style={this.props.errorStyle}
          >
            * {error} {this.props.fileTypeError}
          </div>
        );
      });
    }
    if (this.state.notAcceptedFileSize.length > 0) {
      notAccepted = this.state.notAcceptedFileSize.map((error, index) => {
        return (
          <div
            className={"errorMessage " + this.props.errorClass}
            key={index}
            style={this.props.errorStyle}
          >
            * {error} {this.props.fileSizeError}
          </div>
        );
      });
    }
    return notAccepted;
  }

  /*
   Render the upload icon
   */
  renderIcon() {
    if (this.props.withIcon) {
      return <img src={UploadIcon} className="uploadIcon" alt="Upload Icon" />;
    }
  }

  /*
   Render label
   */
  renderLabel() {
    if (this.props.withLabel) {
      return (
        <p className={this.props.labelClass} style={this.props.labelStyles}>
          {this.props.label}
        </p>
      );
    }

    return null;
  }

  /*
   Render preview images
   */
  renderPreview() {
    return (
      <div className="uploadPicturesWrapper">
        <FlipMove enterAnimation="fade" leaveAnimation="fade" style={styles}>
          {this.renderPreviewPictures()}
        </FlipMove>
      </div>
    );
  }

  renderPreviewPictures() {
    const { maxItemsCount, ImageComponent } = this.props;

    return this.state.pictures.map((picture, index) => {
      let className = "uploadPicture";

      if (maxItemsCount && index >= maxItemsCount) {
        className += " disabled";
      }

      if (typeof picture !== "string") return null;

      return (
        <div key={index} className="uploadPictureContainer">
          <div
            className="deleteImage"
            onClick={() => this.removeImage(picture)}
          >
            <img src={closeIcon} />
          </div>
          {ImageComponent ? (
            <ImageComponent src={picture} className={className} />
          ) : (
            <img src={picture} className={className} alt="preview" />
          )}
        </div>
      );
    });
  }

  /*
   On button click, trigger input file to open
   */
  triggerFileUpload() {
    const { maxItemsCount, onMaxItemsOverflow } = this.props;
    const { pictures } = this.state;

    if (pictures.length >= maxItemsCount) {
      onMaxItemsOverflow();
    } else {
      this.inputElement.click();
    }
  }

  render() {
    return (
      <div
        className={"fileUploader " + this.props.className}
        style={this.props.style}
      >
        <div className="errorsContainer">{this.renderErrors()}</div>
        {this.renderLabel()}
        <div className="fileContainer" style={this.props.fileContainerStyle}>
          {this.renderIcon()}
          <div>
            <button
              type={this.props.buttonType}
              className={"chooseFileButton " + this.props.buttonClassName}
              style={this.props.buttonStyles}
              onClick={this.triggerFileUpload}
            >
              {this.props.buttonText || <div className="chooseFileButtonImg" />}
            </button>
            <input
              type="file"
              ref={input => (this.inputElement = input)}
              name={this.props.name}
              multiple={!this.props.singleImage}
              onChange={this.onDropFile}
              onClick={this.onUploadClick}
              accept={this.props.accept}
            />
          </div>
          {this.props.withPreview ? this.renderPreview() : null}
        </div>
      </div>
    );
  }
}

ReactImageUploadComponent.defaultProps = {
  className: "",
  fileContainerStyle: {},
  buttonClassName: "",
  buttonStyles: {},
  withPreview: false,
  accept: "image/*",
  name: "",
  withIcon: true,
  buttonText: "Choose images",
  buttonType: "button",
  withLabel: true,
  label: "Max file size: 5mb, accepted: jpg|gif|png",
  labelStyles: {},
  labelClass: "",
  imgExtension: [".jpg", ".jpeg", ".gif", ".png"],
  maxFileSize: 5242880,
  fileSizeError: " file size is too big",
  fileTypeError: " is not a supported file extension",
  errorClass: "",
  style: {},
  errorStyle: {},
  singleImage: true,
  onChange: () => {},
  defaultImage: ""
};

ReactImageUploadComponent.propTypes = {
  style: PropTypes.object,
  fileContainerStyle: PropTypes.object,
  className: PropTypes.string,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  buttonClassName: PropTypes.string,
  buttonStyles: PropTypes.object,
  buttonType: PropTypes.string,
  withPreview: PropTypes.bool,
  accept: PropTypes.string,
  name: PropTypes.string,
  withIcon: PropTypes.bool,
  buttonText: PropTypes.string,
  withLabel: PropTypes.bool,
  label: PropTypes.string,
  labelStyles: PropTypes.object,
  labelClass: PropTypes.string,
  imgExtension: PropTypes.array,
  maxFileSize: PropTypes.number,
  fileSizeError: PropTypes.string,
  fileTypeError: PropTypes.string,
  errorClass: PropTypes.string,
  errorStyle: PropTypes.object,
  singleImage: PropTypes.bool,
  defaultImage: PropTypes.string
};

export default ReactImageUploadComponent;
